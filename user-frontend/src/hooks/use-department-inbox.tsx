"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataTableRow } from "@/components/shared/data-table";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchDepartmentRequests } from "@/lib/requests-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { invalidateApiCache, peekApiCache, cacheScopeUserId } from "@/lib/query-cache";
import { type ListTabBucket } from "@/lib/request-status-groups";
import type { RequestItem } from "@/types/request";

const EMPTY = { items: [] as RequestItem[], total: 0, page: 1, totalPages: 1 };

type InboxOptions = {
  /** When false, skips inbox API calls (e.g. non-managers on /department-inbox). */
  enabled?: boolean;
};

function inboxCacheKey(dept: string, page: number, tab: ListTabBucket, debouncedQ: string) {
  const q = debouncedQ.trim();
  return `requests:dept:${cacheScopeUserId()}:${dept}:${page}:${LIST_PAGE_SIZE}:${tab}:${q}`;
}

export function useDepartmentInbox(
  dept: string | null | undefined,
  options: InboxOptions = {},
) {
  const enabled = options.enabled !== false;
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<ListTabBucket>("ALL");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);

  const cacheKey = dept ? inboxCacheKey(dept, page, tab, debouncedQ) : "";
  const cached = enabled && dept ? peekApiCache<typeof EMPTY>(cacheKey) : undefined;

  const [result, setResult] = useState(cached ?? EMPTY);
  const [loading, setLoading] = useState(Boolean(enabled && dept && !cached));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || !dept) {
      setResult(EMPTY);
      setLoading(false);
      return;
    }
    invalidateApiCache(`requests:dept:${cacheScopeUserId()}:${dept}:`);
    setLoading(true);
    setError(null);
    try {
      setResult(
        await fetchDepartmentRequests(dept, {
          page,
          limit: LIST_PAGE_SIZE,
          tab,
          q: debouncedQ || undefined,
        }),
      );
    } catch (e) {
      setResult(EMPTY);
      setError(apiErrorMessage(e, "Could not load the department inbox. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [enabled, dept, page, tab, debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedQ]);

  useEffect(() => {
    if (!enabled || !dept) {
      setResult(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }

    const key = inboxCacheKey(dept, page, tab, debouncedQ);
    const hit = peekApiCache<typeof EMPTY>(key);
    if (hit) {
      setResult(hit);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setError(null);
    let cancelled = false;

    fetchDepartmentRequests(dept, {
      page,
      limit: LIST_PAGE_SIZE,
      tab,
      q: debouncedQ || undefined,
    })
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((e) => {
        if (!cancelled && !hit) {
          setResult(EMPTY);
          setError(apiErrorMessage(e, "Could not load the department inbox. Please try again."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, dept, page, tab, debouncedQ]);

  useEffect(() => {
    if (!enabled || !dept) return;

    const onRefresh = (scope: AppRefreshScope) => {
      if (matchesRefreshScope(scope, ["requests", "all"])) {
        void reload();
      }
    };

    return subscribeAppRefresh(onRefresh);
  }, [enabled, dept, reload]);

  const tableRows: DataTableRow[] = useMemo(
    () =>
      result.items.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        title: r.title,
        requestedBy: r.requestedBy ?? "—",
        sourceDepartment: r.sourceDepartment ?? r.department ?? "—",
        requestType: r.requestType,
        priority: r.priority ?? "—",
        status: r.status,
        progress: `${r.progress}%`,
        deadline: r.deadline || "—",
        assignedMembers: r.assignedMembers || "—",
        __view: <TableOpenLink href={`/requests/${r.id}?from=inbox`} />,
      })),
    [result.items],
  );

  const showingCount = debouncedQ ? tableRows.length : result.total;

  return {
    result,
    loading,
    error,
    page,
    setPage,
    tab,
    setTab,
    q,
    setQ,
    tableRows,
    showingCount,
    reload,
  };
}
