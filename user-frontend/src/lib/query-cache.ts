import { loadSession } from "@/lib/session";

type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
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
  for (const key of Array.from(inFlight.keys())) {
    if (!prefix || key.startsWith(prefix)) inFlight.delete(key);
  }
}

export async function cachedApi<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.data;

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const epochAtStart = cacheEpoch;
  const promise = fetcher()
    .then((data) => {
      if (epochAtStart === cacheEpoch) {
        cache.set(key, { data, expiresAt: now + ttlMs });
      }
      inFlight.delete(key);
      return data;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}
