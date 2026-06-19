"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchMyAssignments } from "@/lib/assignments-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { peekApiCache, cacheScopeUserId, setApiCache } from "@/lib/query-cache";
import { type ListTabBucket } from "@/lib/request-status-groups";
import type { Assignment } from "@/types/task";

const EMPTY = { items: [] as Assignment[], total: 0, page: 1, totalPages: 1 };

function assignmentsCacheKey(page: number, tab: ListTabBucket, debouncedQ: string) {
  const q = debouncedQ.trim();
  return `assignments:mine:${cacheScopeUserId()}:${page}:${LIST_PAGE_SIZE}:${tab}:${q}`;
}

export function useMyAssignments(
  userId: string | undefined,
  page: number,
  tab: ListTabBucket,
  debouncedQ: string,
) {
  const pathname = usePathname();
  const cacheKey = assignmentsCacheKey(page, tab, debouncedQ);
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

      const key = assignmentsCacheKey(page, tab, debouncedQ);
      const hit = peekApiCache<typeof EMPTY>(key);
      if (hit) {
        setResult(hit);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        const data = await fetchMyAssignments(
          {
            page,
            limit: LIST_PAGE_SIZE,
            tab,
            q: debouncedQ || undefined,
          },
          signal,
        );
        if (!signal?.aborted) {
          setResult(data);
          setApiCache(key, data);
        }
      } catch (e) {
        if (!signal?.aborted) {
          setResult(EMPTY);
          setError(apiErrorMessage(e, "Could not load your tasks. Please try again."));
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [userId, page, tab, debouncedQ],
  );

  useEffect(() => {
    if (!pathname.startsWith("/tasks")) return;
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [pathname, load]);

  useEffect(() => {
    if (!userId) return;

    const onRefresh = (scope: AppRefreshScope) => {
      if (matchesRefreshScope(scope, ["assignments", "all"])) {
        void load();
      }
    };

    return subscribeAppRefresh(onRefresh);
  }, [userId, load]);

  return { result, loading, error, reload: () => load() };
}
