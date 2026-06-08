import { CacheKeys } from './cache-keys';
import { CacheService } from './cache.service';

/** Clear admin dashboard/report aggregate caches after workflow or config changes. */
export async function invalidateAdminStatsCache(
  cache: CacheService,
): Promise<void> {
  await cache.del(CacheKeys.adminDashboardSummary);
  await cache.delByPrefix(CacheKeys.adminReportsPrefix);
}
