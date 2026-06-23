import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ActivityAction } from '@prisma/client';
import { AuditLogService } from '../../common/audit-log/audit-log.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { SystemEventsService } from '../../common/system-events/system-events.service';
import type { JwtPayload } from '../../common/auth.types';
import { mapUserToResponse } from '../users/user-response.mapper';
import { userDepartmentInclude } from '../users/user-department.include';
import { loadManagedDepartments } from '../../common/department-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { ZamtelStaffAuthService } from './zamtel-auth.service';
import { DevAuthService } from './dev-auth.service';

export const ADMIN_ROLE_NAMES = new Set(['Admin', 'System Admin']);

type LoginOptions = { adminOnly?: boolean };

export type LoginResult = {
  user: ReturnType<typeof mapUserToResponse> & {
    inboxDepartmentName: string | null;
    managedDepartmentIds: string[];
    managedDepartmentNames: string[];
  };
  accessToken: string;
  /** Token lifetime in seconds */
  expiresIn: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditLogService,
    private readonly systemEvents: SystemEventsService,
    private readonly cache: CacheService,
    private readonly zamtel: ZamtelStaffAuthService,
    private readonly dev: DevAuthService,
  ) {}

  /** Real Zamtel staff login (GN + AD password). */
  async loginWithStaff(
    gn: string,
    password: string,
    options?: LoginOptions,
  ): Promise<LoginResult> {
    let userId: string;
    try {
      userId = await this.zamtel.authenticate(gn, password);
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        void this.systemEvents.record({
          level: 'WARN',
          code: 'LOGIN_FAILED',
          message: `Failed Zamtel staff login for gn=${gn}`,
          path: '/auth/login',
          httpMethod: 'POST',
        });
      }
      throw err;
    }
    return this.finalizeSession(userId, { ...options, portal: 'staff' });
  }

  /** Dev-only login by email (no password). Disabled in production. */
  async loginAsDev(
    email: string,
    options?: LoginOptions,
  ): Promise<LoginResult> {
    const userId = await this.dev.authenticate(email);
    return this.finalizeSession(userId, { ...options, portal: 'dev' });
  }

  /** Build the rich session response, enforce admin-portal access, sign the JWT. */
  private async finalizeSession(
    userId: string,
    options: LoginOptions & { portal: 'staff' | 'dev' },
  ): Promise<LoginResult> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      include: {
        department: userDepartmentInclude,
        role: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }

    const roleName = user.role?.name ?? null;
    if (options.adminOnly && (!roleName || !ADMIN_ROLE_NAMES.has(roleName))) {
      void this.systemEvents.record({
        level: 'WARN',
        code: 'ADMIN_LOGIN_DENIED',
        message: `Non-admin user attempted admin portal sign-in (${user.email}).`,
        path: '/auth/login',
        httpMethod: 'POST',
        userId: user.id,
      });
      throw new ForbiddenException('Admin access required');
    }

    // Provisioning may have refreshed profile/department — drop any stale cache.
    await this.cache.del(CacheKeys.authUser(user.id));

    const profile = mapUserToResponse(user);
    const managed = await loadManagedDepartments(this.prisma, user.id);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roleName,
      departmentName: profile.departmentName,
    };
    const accessToken = await this.jwt.signAsync(payload);
    const expiresIn =
      parseInt(process.env.JWT_EXPIRES_IN?.trim() ?? '', 10) || 28800;

    const portalLabel = options.adminOnly ? 'admin portal' : 'user portal';
    const via = options.portal === 'dev' ? ' via dev-login' : '';
    void this.audit.record({
      userId: user.id,
      action: ActivityAction.USER_SIGNED_IN,
      description: `Signed in to ${portalLabel}${via} (${user.email}).`,
    });

    return {
      user: {
        ...profile,
        inboxDepartmentName: managed.names[0] ?? null,
        managedDepartmentIds: managed.ids,
        managedDepartmentNames: managed.names,
      },
      accessToken,
      expiresIn,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true },
      include: {
        department: userDepartmentInclude,
        role: { select: { id: true, name: true } },
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    const managed = await loadManagedDepartments(this.prisma, user.id);
    return {
      ...mapUserToResponse(user),
      inboxDepartmentName: managed.names[0] ?? null,
      managedDepartmentIds: managed.ids,
      managedDepartmentNames: managed.names,
    };
  }
}
