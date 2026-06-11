import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import type { CacheService } from '../../common/cache/cache.service';

export async function invalidateAfterRequestLifecycle(
  cache: CacheService,
  ...userIds: string[]
) {
  await Promise.all(
    userIds.map((id) => cache.del(CacheKeys.workspaceSummary(id))),
  );
  await invalidateAdminStatsCache(cache);
}
