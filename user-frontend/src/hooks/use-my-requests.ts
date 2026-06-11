"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchMyRequests } from "@/lib/requests-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { type ListTabBucket } from "@/lib/request-status-groups";
import type { RequestItem } from "@/types/request";

const EMPTY = { items: [] as RequestItem[], total: 0, page: 1, totalPages: 1 };

export function useMyRequests(
  userId: string | undefined,
  page: number,
  tab: ListTabBucket,
  debouncedQ: string,
) {
  const pathname = usePathname();
  const [result, setResult] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setResult(EMPTY);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyRequests(
          {
            page,
            limit: LIST_PAGE_SIZE,
            tab,
            q: debouncedQ || undefined,
          },
          signal,
        );
        if (!signal?.aborted) setResult(data);
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
