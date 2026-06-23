import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  inferDepartmentFromTitle,
  normalizeDepartmentName,
  resolveDepartmentAlias,
} from './department-aliases';

/**
 * Mirrors the central Zamtel LDAP directory into the local `users` table.
 *
 * The directory is the source of truth for *who exists*. We fetch it from
 * {ZAMTEL_AUTH_BASE_URL}/api/ldap/get/allusers using the signed-in user's own
 * bearer token (captured at login) and upsert each entry locally, keyed by GN
 * (sAMAccountName). Keeping the local row — and its stable UUID — intact means
 * assignments, milestones and every other relation keep working unchanged; the
 * lists and pickers simply reflect live LDAP membership.
 *
 * Sync is throttled (see SYNC_INTERVAL_MS) so listing endpoints can call it
 * freely without hammering the upstream service or the database.
 */

/** Raw LDAP payload entry — field names match the upstream contract exactly. */
interface LdapDirectoryUser {
  displayName?: string;
  sAMAccountName?: string;
  title?: string;
  manager?: string;
  memberOf?: string[];
  department?: string;
  mail?: string;
  mobile?: string;
}

interface LdapDirectoryResponse {
  payload?: LdapDirectoryUser[];
}

const DEFAULT_ROLE_NAME = 'Employee';
const FALLBACK_DEPARTMENT_NAME = 'Shared Services';
const FETCH_TIMEOUT_MS = 15_000;
const SYNC_INTERVAL_MS = 5 * 60_000; // re-sync at most once every 5 minutes
const EMAIL_DOMAIN = 'zamtel.co.zm';
/**
 * Minimum normalized similarity (0–1) for an LDAP department string to be
 * treated as an existing department rather than a new one. 0.82 tolerates a
 * couple of edits on a long name ("Information Technology" vs "Information
 * Technolgy" ≈ 0.95) while keeping short, distinct names from merging.
 */
const NAME_MATCH_THRESHOLD = 0.82;

/** An existing department reduced to its normalized name for matching. */
interface KnownDepartment {
  id: string;
  name: string;
  norm: string;
  parentDepartmentId: string | null;
}

@Injectable()
export class ZamtelDirectoryService {
  private readonly logger = new Logger(ZamtelDirectoryService.name);
  private lastSyncAt = 0;
  private inFlight: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensure the local users table reflects the LDAP directory. No-ops when no
   * token is available (e.g. dev-login) or when a recent sync already ran, so
   * callers can invoke it on every list request. Never throws — on any failure
   * we log and leave the existing local data in place.
   */
  async ensureSynced(token: string | null, force = false): Promise<void> {
    if (!token) {
      this.logger.debug(
        'LDAP directory sync skipped — no Zamtel staff token (sign in with GN + password).',
      );
      return;
    }
    if (!force && Date.now() - this.lastSyncAt < SYNC_INTERVAL_MS) return;
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.sync(token)
      .catch((err) => {
        this.logger.warn(
          `LDAP directory sync failed; serving existing users (${(err as Error).message}).`,
        );
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }

  private async sync(token: string): Promise<void> {
    const entries = await this.fetchDirectory(token);
    // Mark synced even on an empty payload so we don't retry in a tight loop.
    this.lastSyncAt = Date.now();
    if (!entries.length) return;

    const defaultRoleId = await this.resolveDefaultRoleId();
    const departments = await this.loadKnownDepartments();

    let upserted = 0;
    for (const entry of entries) {
      try {
        const ok = await this.upsertEntry(entry, defaultRoleId, departments);
        if (ok) upserted += 1;
      } catch (err) {
        this.logger.debug(
          `Skipped LDAP user ${entry.sAMAccountName ?? '(no gn)'}: ${(err as Error).message}`,
        );
      }
    }
    this.logger.log(`Synced ${upserted}/${entries.length} users from LDAP directory.`);
  }

  /** ── HTTP ─────────────────────────────────────────────────────────────── */

  private async fetchDirectory(token: string): Promise<LdapDirectoryUser[]> {
    const base = process.env.ZAMTEL_AUTH_BASE_URL?.trim();
    if (!base) return [];
    const url = `${base.replace(/\/$/, '')}/api/ldap/get/allusers`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!resp.ok) {
      throw new Error(`LDAP directory returned HTTP ${resp.status}`);
    }
    const body = (await resp
      .json()
      .catch(() => null)) as LdapDirectoryResponse | null;
    return Array.isArray(body?.payload) ? body.payload : [];
  }

  /** ── Upsert ───────────────────────────────────────────────────────────── */

  private async upsertEntry(
    entry: LdapDirectoryUser,
    defaultRoleId: string | null,
    departments: KnownDepartment[],
  ): Promise<boolean> {
    const gn = entry.sAMAccountName?.trim();
    if (!gn) return false;

    const email = this.resolveEmail(entry, gn);
    const fullName = this.formatName(entry.displayName) || gn;
    const jobTitle = entry.title?.trim() || null;

    const existing =
      (await this.prisma.user.findUnique({ where: { gn } })) ??
      (await this.prisma.user.findUnique({ where: { email } }));

    if (!existing) {
      const departmentId = await this.resolveParentDepartmentId(
        this.extractDepartmentName(entry),
        departments,
      );
      await this.prisma.user.create({
        data: {
          fullName,
          email,
          gn,
          jobTitle,
          departmentId,
          roleId: defaultRoleId,
          isActive: true,
        },
      });
      return true;
    }

    // Refresh directory-owned fields on every sync. Role and isActive are
    // preserved — admins control portal access and account status locally.
    const parentId = await this.resolveParentDepartmentId(
      this.extractDepartmentName(entry),
      departments,
    );
    const departmentId = this.resolveDepartmentIdForSync(
      existing.departmentId,
      parentId,
      departments,
    );

    await this.prisma.user.update({
      where: { id: existing.id },
      data: {
        fullName,
        gn,
        jobTitle,
        ...(departmentId ? { departmentId } : {}),
      },
    });
    return true;
  }

  /** displayName arrives as "Surname, First" — present it as "First Surname". */
  private formatName(displayName: string | undefined): string {
    const dn = displayName?.trim() ?? '';
    const comma = dn.indexOf(',');
    if (comma > 0) {
      const last = dn.slice(0, comma).trim();
      const first = dn.slice(comma + 1).trim();
      if (first && last) return `${first} ${last}`;
    }
    return dn;
  }

  private resolveEmail(entry: LdapDirectoryUser, gn: string): string {
    const mail = entry.mail?.trim().toLowerCase();
    if (mail) return mail;
    return `${gn.toLowerCase()}@${EMAIL_DOMAIN}`;
  }

  private async resolveDefaultRoleId(): Promise<string | null> {
    const role = await this.prisma.role.findUnique({
      where: { name: DEFAULT_ROLE_NAME },
      select: { id: true },
    });
    return role?.id ?? null;
  }

  private async loadKnownDepartments(): Promise<KnownDepartment[]> {
    const rows = await this.prisma.department.findMany({
      select: { id: true, name: true, parentDepartmentId: true },
    });
    return rows.map((d) => ({
      id: d.id,
      name: d.name,
      norm: this.normalizeName(d.name),
      parentDepartmentId: d.parentDepartmentId,
    }));
  }

  /**
   * Best-effort department string from an LDAP row. Zamtel often leaves
   * `department` empty but encodes the team in `title` or `memberOf` OUs.
   */
  private extractDepartmentName(entry: LdapDirectoryUser): string | undefined {
    const direct = entry.department?.trim();
    if (direct) return direct;

    const fromTitle = inferDepartmentFromTitle(entry.title);
    if (fromTitle) return fromTitle;

    for (const dn of entry.memberOf ?? []) {
      const fromDn = this.extractDepartmentFromDn(dn);
      if (fromDn) return fromDn;
    }

    return undefined;
  }

  /** Pull a human-readable OU segment from an LDAP distinguished name. */
  private extractDepartmentFromDn(dn: string): string | null {
    const skip = new Set([
      'users',
      'zamtel',
      'staff',
      'employees',
      'accounts',
      'corp',
      'corporate',
    ]);
    for (const m of dn.matchAll(/OU=([^,]+)/gi)) {
      const name = m[1]?.trim();
      if (!name) continue;
      const norm = normalizeDepartmentName(name);
      if (skip.has(norm)) continue;
      return resolveDepartmentAlias(norm) ?? name;
    }
    return null;
  }

  /**
   * LDAP assigns users to the top-level department only. Sub-section membership
   * is controlled by admins in the portal.
   */
  private resolveDepartmentIdForSync(
    currentDepartmentId: string | null,
    parentId: string | null,
    departments: KnownDepartment[],
  ): string | null {
    if (!parentId) return currentDepartmentId;
    if (!currentDepartmentId) return parentId;

    const current = departments.find((d) => d.id === currentDepartmentId);
    if (!current) return parentId;

    const currentParentId = current.parentDepartmentId ?? current.id;
    if (currentParentId === parentId) return currentDepartmentId;

    return parentId;
  }

  private async resolveParentDepartmentId(
    name: string | undefined,
    departments: KnownDepartment[],
  ): Promise<string | null> {
    return this.resolveOrCreateDepartmentId(name, departments);
  }

  /**
   * Resolve an LDAP `department` string to a local **top-level** department id.
   * Applies alias folding, then exact/fuzzy match against known rows. When nothing
   * matches, creates a new top-level department from the Zamtel value.
   */
  private async resolveOrCreateDepartmentId(
    name: string | undefined,
    departments: KnownDepartment[],
  ): Promise<string | null> {
    const raw =
      name && name.trim().length > 0 ? name.trim() : FALLBACK_DEPARTMENT_NAME;
    const norm = this.normalizeName(raw);

    // 1) Explicit alias for known AD variants → canonical name.
    const aliasCanon = resolveDepartmentAlias(norm);
    const displayName = aliasCanon ?? raw;
    const targetNorm = this.normalizeName(displayName);
    const topLevel = departments.filter((d) => !d.parentDepartmentId);

    // 2) Exact match (in-memory cache from this sync batch).
    const exact = topLevel.find((d) => d.norm === targetNorm);
    if (exact) return exact.id;

    // 3) Fuzzy match against existing top-level departments.
    let best: { dept: KnownDepartment; ratio: number } | null = null;
    for (const dept of topLevel) {
      const ratio = this.similarity(targetNorm, dept.norm);
      if (ratio >= NAME_MATCH_THRESHOLD && (!best || ratio > best.ratio)) {
        best = { dept, ratio };
      }
    }
    if (best) return best.dept.id;

    // 4) Re-check DB (another request may have created it) then create.
    const existing = await this.prisma.department.findFirst({
      where: {
        name: { equals: displayName, mode: 'insensitive' },
        parentDepartmentId: null,
      },
      select: { id: true, name: true, parentDepartmentId: true },
    });
    if (existing) {
      const known: KnownDepartment = {
        id: existing.id,
        name: existing.name,
        norm: this.normalizeName(existing.name),
        parentDepartmentId: existing.parentDepartmentId,
      };
      if (!departments.some((d) => d.id === known.id)) {
        departments.push(known);
      }
      return existing.id;
    }

    try {
      const created = await this.prisma.department.create({
        data: { name: displayName, parentDepartmentId: null },
      });
      departments.push({
        id: created.id,
        name: created.name,
        norm: targetNorm,
        parentDepartmentId: null,
      });
      this.logger.log(
        `Auto-created department "${displayName}" from LDAP directory.`,
      );
      return created.id;
    } catch (err) {
      // Unique race — fetch the row another upsert just created.
      const raced = await this.prisma.department.findFirst({
        where: {
          name: { equals: displayName, mode: 'insensitive' },
          parentDepartmentId: null,
        },
        select: { id: true, name: true, parentDepartmentId: true },
      });
      if (raced) {
        const known: KnownDepartment = {
          id: raced.id,
          name: raced.name,
          norm: this.normalizeName(raced.name),
          parentDepartmentId: raced.parentDepartmentId,
        };
        if (!departments.some((d) => d.id === known.id)) {
          departments.push(known);
        }
        return raced.id;
      }
      this.logger.warn(
        `Could not resolve LDAP department "${raw}": ${(err as Error).message}`,
      );
      return null;
    }
  }

  /** Lowercase, trim, and collapse internal whitespace runs to a single space. */
  private normalizeName(name: string): string {
    return normalizeDepartmentName(name);
  }

  /** Normalized similarity in [0, 1] based on Levenshtein edit distance. */
  private similarity(a: string, b: string): number {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - this.levenshtein(a, b) / maxLen;
  }

  private levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let curr = new Array<number>(b.length + 1);
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1, // deletion
          curr[j - 1] + 1, // insertion
          prev[j - 1] + cost, // substitution
        );
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length];
  }
}
