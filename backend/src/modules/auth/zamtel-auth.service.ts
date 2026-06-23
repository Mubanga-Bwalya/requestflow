import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { AuditLogService } from '../../common/audit-log/audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StaffTokenStore } from './staff-token.store';

/**
 * Zamtel staff auth payload (200 response from the central staff service).
 * Field names match the upstream contract exactly — do not rename.
 */
interface ZamtelStaffPayload {
  name: string;
  gn: string;
  email: string;
  title?: string;
  department?: string;
  mobile?: string;
  manager?: string;
  memberOf?: string[];
  /** Staff service's own JWT — we don't reuse it; we mint our own. */
  token?: string;
}

interface StaffAuthResponse {
  payload: ZamtelStaffPayload;
  message?: string;
  status?: number;
}

const DEFAULT_ROLE_NAME = 'Employee';
const FALLBACK_DEPARTMENT_NAME = 'Shared Services';
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Talks to the central Zamtel staff auth service and mirrors the payload into
 * the local `users` table. Returns the provisioned user id; AuthService builds
 * the session/JWT from there.
 *
 * Canonical flow: POST {ZAMTEL_AUTH_BASE_URL}/api/auth/login with { gn, password }.
 * Quirk: the upstream service returns HTTP 500 (not 401) for bad credentials.
 */
@Injectable()
export class ZamtelStaffAuthService {
  private readonly logger = new Logger(ZamtelStaffAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly staffTokens: StaffTokenStore,
  ) {}

  /** Authenticate by GN + AD password, upsert the local user, return its id. */
  async authenticate(gn: string, password: string): Promise<string> {
    const payload = await this.callStaffService(gn, password);
    const userId = await this.upsertFromPayload(payload);
    // Keep the upstream staff token so backend services (LDAP directory sync)
    // can call Zamtel APIs with this user's own bearer token.
    await this.staffTokens.save(userId, payload.token);
    return userId;
  }

  /** ── HTTP call (isolated for testability) ─────────────────────────────── */

  private async callStaffService(
    gn: string,
    password: string,
  ): Promise<ZamtelStaffPayload> {
    const base = process.env.ZAMTEL_AUTH_BASE_URL?.trim();
    if (!base) {
      throw new InternalServerErrorException(
        'ZAMTEL_AUTH_BASE_URL is not configured. Set it in .env or use POST /auth/dev-login.',
      );
    }
    const url = `${base.replace(/\/$/, '')}/api/auth/login`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gn, password }),
        signal: controller.signal,
      });
    } catch (e) {
      // Network-level errors (no HTTP response) → service unavailable.
      this.logger.warn(
        `Staff auth network error for gn=${gn}: ${(e as Error).message}`,
      );
      throw new ServiceUnavailableException(
        'Zamtel auth service is unreachable',
      );
    } finally {
      clearTimeout(timer);
    }

    // Upstream service-unavailable codes → propagate as 503.
    if ([502, 503, 504].includes(resp.status)) {
      this.logger.warn(
        `Staff auth upstream returned ${resp.status} for gn=${gn}`,
      );
      throw new ServiceUnavailableException(
        'Zamtel auth service is unavailable',
      );
    }

    // Quirk: the service returns HTTP 500 for invalid credentials, not 401.
    // Anything that isn't a clean 2xx is treated as invalid credentials.
    if (!resp.ok) {
      throw new UnauthorizedException('Invalid staff credentials');
    }

    const body = (await resp
      .json()
      .catch(() => null)) as StaffAuthResponse | null;
    if (!body?.payload?.gn || !body.payload.email) {
      this.logger.error(
        `Staff auth returned 200 with malformed payload for gn=${gn}`,
      );
      throw new UnauthorizedException(
        'Invalid response from staff auth service',
      );
    }
    return body.payload;
  }

  /** ── User + department reconciliation ─────────────────────────────────── */

  /**
   * Mirror the staff payload into the local `users` table. Match priority:
   * 1) by gn (canonical staff identifier)
   * 2) by email (covers a seeded/dev user upgrading to real Zamtel auth)
   * 3) create new (role defaults to "Employee" — admin promotion stays manual)
   *
   * Department and role of an *existing* user are left untouched so admin
   * assignments are preserved; only fields the upstream owns (name, title, gn)
   * are refreshed, and department is backfilled only when missing.
   */
  private async upsertFromPayload(
    payload: ZamtelStaffPayload,
  ): Promise<string> {
    const email = payload.email.toLowerCase().trim();
    const upstreamFields = {
      fullName: payload.name,
      jobTitle: payload.title ?? null,
    };

    let user =
      (await this.prisma.user.findUnique({ where: { gn: payload.gn } })) ??
      (await this.prisma.user.findUnique({ where: { email } }));

    if (!user) {
      const departmentId = await this.resolveDepartment(payload.department);
      const roleId = await this.resolveDefaultRoleId();
      const created = await this.prisma.user.create({
        data: {
          ...upstreamFields,
          email,
          gn: payload.gn,
          departmentId,
          roleId,
          isActive: true,
        },
      });
      await this.audit.record({
        userId: created.id,
        action: ActivityAction.ADMIN_USER_CHANGED,
        description: `Auto-provisioned user ${email} (gn ${payload.gn}) from Zamtel staff auth.`,
      });
      return created.id;
    }

    const backfillDepartmentId = user.departmentId
      ? undefined
      : await this.resolveDepartment(payload.department);

    user = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...upstreamFields,
        gn: payload.gn,
        ...(backfillDepartmentId ? { departmentId: backfillDepartmentId } : {}),
      },
    });

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is inactive — contact an administrator',
      );
    }
    return user.id;
  }

  private async resolveDefaultRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findUnique({
      where: { name: DEFAULT_ROLE_NAME },
      select: { id: true },
    });
    return role?.id ?? null;
  }

  /**
   * Match the staff `department` string to an existing Department by name.
   * On miss, create a new Department row and audit it so an admin can re-org.
   * Missing upstream value falls back to "Shared Services".
   */
  private async resolveDepartment(name: string | undefined): Promise<string> {
    const target =
      name && name.trim().length > 0 ? name.trim() : FALLBACK_DEPARTMENT_NAME;
    const existing = await this.prisma.department.findUnique({
      where: { name: target },
      select: { id: true },
    });
    if (existing) return existing.id;

    this.logger.warn(
      `Unknown department "${target}" from staff service — creating new row.`,
    );
    const created = await this.prisma.department.create({
      data: { name: target },
    });
    await this.audit.record({
      action: ActivityAction.ADMIN_SETTINGS_CHANGED,
      description: `Auto-created department "${target}" from Zamtel staff auth.`,
    });
    return created.id;
  }
}
