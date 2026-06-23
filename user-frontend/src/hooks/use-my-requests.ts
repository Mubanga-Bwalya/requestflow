"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { apiErrorMessage } from "@/lib/api-error";
import { withRetry } from "@/lib/retry";
import { fetchMyRequests } from "@/lib/requests-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { peekApiCache, cacheScopeUserId, setApiCache } from "@/lib/query-cache";
import { type ListTabBucket } from "@/lib/request-status-groups";
import type { RequestItem } from "@/types/request";

const EMPTY = { items: [] as RequestItem[], total: 0, page: 1, totalPages: 1 };

function requestsCacheKey(page: number, tab: ListTabBucket, debouncedQ: string) {
  const q = debouncedQ.trim();
  return `requests:mine:${cacheScopeUserId()}:${page}:${LIST_PAGE_SIZE}:${tab}:${q}`;
}

export function useMyRequests(
  userId: string | undefined,
  page: number,
  tab: ListTabBucket,
  debouncedQ: string,
) {
  const pathname = usePathname();
  const cacheKey = requestsCacheKey(page, tab, debouncedQ);
  const cached = peekApiCache<typeof EMPTY>(cacheKey);
  const [result, setResult] = useState(cached ?? EMPTY);
  const [loading, setLoading] = useState(!cached && Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setResult(EMPTY);
        setLoading(false);
        return;
      }

      const key = requestsCacheKey(page, tab, debouncedQ);
      const hit = peekApiCache<typeof EMPTY>(key);
      if (hit) {
        setResult(hit);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        // Note: the abort signal is intentionally NOT passed into the network
        // request. fetchMyRequests is cache-deduped, so several consumers can
        // share one in-flight request; cancelling it from one unmount would
        // reject it for the others (surfacing a false "could not load"). The
        // signal only guards setState below and stops retries after unmount.
        const data = await withRetry(
          () =>
            fetchMyRequests({
              page,
              limit: LIST_PAGE_SIZE,
              tab,
              q: debouncedQ || undefined,
            }),
          { signal },
        );
        if (!signal?.aborted) {
          setResult(data);
          setApiCache(key, data);
        }
      } catch (e) {
        if (!signal?.aborted) {
          setResult(EMPTY);
          setError(apiErrorMessage(e, "Could not load your requests. Please try again."));
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [userId, page, tab, debouncedQ],
  );

  useEffect(() => {
    if (pathname !== "/requests") return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [pathname, load]);

  useEffect(() => {
    if (!userId) return;

    const onRefresh = (scope: AppRefreshScope) => {
      if (matchesRefreshScope(scope, ["requests", "all"])) {
        void load();
      }
    };

    return subscribeAppRefresh(onRefresh);
  }, [userId, load]);

  return { result, loading, error, reload: () => load() };
}
