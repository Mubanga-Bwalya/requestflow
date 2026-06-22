import { Injectable } from '@nestjs/common';
import { CacheService } from '../../common/cache/cache.service';

/**
 * Stores the short-lived Zamtel staff JWT captured during login so backend
 * services (e.g. the LDAP directory sync) can call upstream Zamtel APIs with the
 * signed-in user's own bearer token.
 *
 * Backed by Redis when available and an in-process map otherwise, so it keeps
 * working in local/offline dev where REDIS_ENABLED=false. Tokens are scoped per
 * user and expire alongside the local session.
 */
const TTL_SECONDS = 28_800; // ~8h — matches the default JWT_EXPIRES_IN session.
const key = (userId: string) => `auth:staff-token:${userId}`;

@Injectable()
export class StaffTokenStore {
  private readonly mem = new Map<string, { token: string; expiresAt: number }>();

  constructor(private readonly cache: CacheService) {}

  async save(userId: string, token: string | null | undefined): Promise<void> {
    const value = token?.trim();
    if (!value) return;
    this.mem.set(userId, { token: value, expiresAt: Date.now() + TTL_SECONDS * 1000 });
    await this.cache.setJson(key(userId), value, TTL_SECONDS);
  }

  async get(userId: string): Promise<string | null> {
    const hit = this.mem.get(userId);
    if (hit && hit.expiresAt > Date.now()) return hit.token;
    if (hit) this.mem.delete(userId);
    return this.cache.getJson<string>(key(userId));
  }
}
