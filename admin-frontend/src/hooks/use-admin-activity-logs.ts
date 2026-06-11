"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminActivityLogs, type ActivityLogItem } from "@/lib/admin-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";

export function useAdminActivityLogs() {
  const [result, setResult] = useState({
    items: [] as ActivityLogItem[],
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await fetchAdminActivityLogs({ page, limit: LIST_PAGE_SIZE }));
    } catch {
      setResult({ items: [], total: 0, page: 1, totalPages: 1 });
      setError("Could not load activity logs. Ensure the API is running.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { result, loading, error, page, setPage, reload };
}
