import { loadSession } from "@/lib/session";

type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();
/** Bumped on invalidation so in-flight fetches cannot repopulate stale data. */
let cacheEpoch = 0;

/** Scope list caches to the signed-in user (avoids cross-account bleed on shared browsers). */
export function cacheScopeUserId(): string {
  return loadSession()?.userId ?? "anon";
}

/** Default client cache — keep short; Redis may cache the same data server-side. */
const DEFAULT_TTL_MS = 15_000;

/** Workspace/dashboard: short TTL to avoid stacking with Redis (20s). */
export const WORKSPACE_CACHE_TTL_MS = 8_000;

export function peekApiCache<T>(key: string): T | undefined {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (!hit || hit.expiresAt <= Date.now()) return undefined;
  return hit.data;
}

export function invalidateApiCache(prefix?: string) {
  cacheEpoch += 1;
  for (const key of Array.from(cache.keys())) {
    if (!prefix || key.startsWith(prefix)) cache.delete(key);
  }
}

export function setApiCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export async function cachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.data;

  const epochAtStart = cacheEpoch;
  const data = await fetcher();
  if (epochAtStart === cacheEpoch) {
    cache.set(key, { data, expiresAt: now + ttlMs });
  }
  return data;
}
