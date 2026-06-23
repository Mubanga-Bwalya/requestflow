import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
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
  norm: string;
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
  async ensureSynced(token: string | null): Promise<void> {
    if (!token) return;
    if (Date.now() - this.lastSyncAt < SYNC_INTERVAL_MS) return;
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
      const departmentId = this.resolveDepartmentId(
        entry.department,
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

    // Refresh only the fields the directory owns. Department and role of an
    // existing user are preserved (admin assignments win); department is only
    // backfilled when missing. isActive is left untouched so admins can disable.
    const backfillDepartmentId = existing.departmentId
      ? undefined
      : this.resolveDepartmentId(entry.department, departments);

    await this.prisma.user.update({
      where: { id: existing.id },
      data: {
        fullName,
        gn,
        jobTitle,
        ...(backfillDepartmentId ? { departmentId: backfillDepartmentId } : {}),
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
      select: { id: true, name: true },
    });
    return rows.map((d) => ({ id: d.id, norm: this.normalizeName(d.name) }));
  }

  /**
   * Resolve an LDAP `department` string to an existing local department id. The
   * department list is curated (admin/seed-owned), so this NEVER creates new
   * rows — it maps onto what already exists, in order:
   *   1) explicit alias (raw AD variant → canonical name, see department-aliases)
   *   2) exact match after whitespace/case normalization
   *   3) fuzzy match for minor typos (e.g. "Information Technolgy")
   *   4) fallback to "Shared Services" so a user is never left without a home
   * Returns null only if even the fallback department is missing.
   */
  private resolveDepartmentId(
    name: string | undefined,
    departments: KnownDepartment[],
  ): string | null {
    const raw =
      name && name.trim().length > 0 ? name.trim() : FALLBACK_DEPARTMENT_NAME;
    const norm = this.normalizeName(raw);

    // 1) Explicit alias for known AD variants → canonical name.
    const aliasCanon = resolveDepartmentAlias(norm);
    const targetNorm = aliasCanon ? this.normalizeName(aliasCanon) : norm;

    // 2) Exact match.
    const exact = departments.find((d) => d.norm === targetNorm);
    if (exact) return exact.id;

    // 3) Fuzzy match: closest existing department above the similarity
    //    threshold. The ratio scales with length, so short distinct names
    //    (e.g. "HRBP") still require a near-exact match.
    let best: { dept: KnownDepartment; ratio: number } | null = null;
    for (const dept of departments) {
      const ratio = this.similarity(targetNorm, dept.norm);
      if (ratio >= NAME_MATCH_THRESHOLD && (!best || ratio > best.ratio)) {
        best = { dept, ratio };
      }
    }
    if (best) return best.dept.id;

    // 4) No match — fall back to Shared Services rather than create drift.
    const fallback = departments.find(
      (d) => d.norm === this.normalizeName(FALLBACK_DEPARTMENT_NAME),
    );
    if (!fallback) {
      this.logger.warn(
        `No match for LDAP department "${raw}" and fallback "${FALLBACK_DEPARTMENT_NAME}" is missing.`,
      );
    }
    return fallback?.id ?? null;
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
