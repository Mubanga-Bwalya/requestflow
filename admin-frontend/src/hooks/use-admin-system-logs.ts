"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminSystemEvents, type SystemEventItem } from "@/lib/admin-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";

export type LogLevelFilter = "ALL" | "ERROR" | "WARN";

export function useAdminSystemLogs() {
  const [result, setResult] = useState({
    items: [] as SystemEventItem[],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<LogLevelFilter>("ALL");

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(
        await fetchAdminSystemEvents({
          page,
          limit: LIST_PAGE_SIZE,
          level,
        }),
      );
    } catch {
      setResult({ items: [], total: 0, page: 1, totalPages: 1 });
      setError(
        "Could not load system logs. Ensure the API is running and migration 008_system_events.sql is applied.",
      );
    } finally {
      setLoading(false);
    }
  }, [level, page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [level]);

  return {
    result,
    loading,
    error,
    page,
    setPage,
    level,
    setLevel,
    reload,
  };
}
