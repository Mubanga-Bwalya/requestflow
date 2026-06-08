"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataTableRow } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fetchDepartmentRequests } from "@/lib/requests-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { peekApiCache } from "@/lib/query-cache";
import { type ListTabBucket } from "@/lib/request-status-groups";
import type { RequestItem } from "@/types/request";

export function useDepartmentInbox(dept: string | null | undefined) {
  const [result, setResult] = useState({ items: [] as RequestItem[], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<ListTabBucket>("ALL");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!dept) {
      setResult({ items: [], total: 0, page: 1, totalPages: 1 });
      setLoading(false);
      return;
    }
    const cacheKey = `requests:dept:${dept}:${tab}:${debouncedQ}:${page}:${LIST_PAGE_SIZE}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      setResult(
        await fetchDepartmentRequests(dept, {
          page,
          limit: LIST_PAGE_SIZE,
          tab,
          q: debouncedQ || undefined,
        }),
      );
    } catch {
      if (!cached) setResult({ items: [], total: 0, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [dept, page, tab, debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedQ]);

  useEffect(() => {
    if (!dept) {
      setResult({ items: [], total: 0, page: 1, totalPages: 1 });
      setLoading(false);
      return;
    }
    const cacheKey = `requests:dept:${dept}:${tab}:${debouncedQ}:${page}:${LIST_PAGE_SIZE}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const controller = new AbortController();
    fetchDepartmentRequests(
      dept,
      { page, limit: LIST_PAGE_SIZE, tab, q: debouncedQ || undefined },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch(() => {
        if (!cached && !controller.signal.aborted) {
          setResult({ items: [], total: 0, page: 1, totalPages: 1 });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [dept, page, tab, debouncedQ]);

  const selected = useMemo(
    () => result.items.find((i) => i.id === selectedId) ?? null,
    [result.items, selectedId],
  );

  const tableRows: DataTableRow[] = useMemo(
    () =>
      result.items.map((r) => ({
        id: r.id,
        title: r.title,
        requestNumber: r.requestNumber,
        requestedBy: r.requestedBy ?? "—",
        sourceDepartment: r.sourceDepartment ?? r.department ?? "—",
        requestType: r.requestType,
        priority: r.priority ?? "—",
        status: r.status,
        progress: `${r.progress}%`,
        deadline: r.deadline || "—",
        assignedMembers: r.assignedMembers || "—",
        __actions: (
          <TableActionButton onClick={() => setSelectedId(r.id)}>Review</TableActionButton>
        ),
      })),
    [result.items],
  );

  const showingCount = debouncedQ ? tableRows.length : result.total;

  return {
    result,
    loading,
    page,
    setPage,
    tab,
    setTab,
    q,
    setQ,
    selectedId,
    setSelectedId,
    selected,
    tableRows,
    showingCount,
    reload,
  };
}
