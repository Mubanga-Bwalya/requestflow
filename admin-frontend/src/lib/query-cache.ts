type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/** Default client cache — admin aggregates are also cached in Redis (~60s). */
const DEFAULT_TTL_MS = 15_000;

export const ADMIN_STATS_CACHE_TTL_MS = 8_000;

export function peekApiCache<T>(key: string): T | undefined {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (!hit || hit.expiresAt <= Date.now()) return undefined;
  return hit.data;
}

export function invalidateApiCache(prefix?: string) {
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

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, expiresAt: now + ttlMs });
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
