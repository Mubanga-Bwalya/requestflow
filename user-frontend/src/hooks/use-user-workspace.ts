"use client";

import { useCallback, useEffect, useState } from "react";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchUserWorkspace } from "@/lib/workspace-api";
import type { Assignment } from "@/types/task";
import type { RequestItem } from "@/types/request";

const EMPTY_STATS = {
  myRequestsTotal: 0,
  needsResponse: 0,
  tasksToStart: 0,
  inboxActions: 0,
};

export function useUserWorkspace(
  userId: string | undefined,
  departmentName: string | null | undefined,
  isManager: boolean,
) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [inbox, setInbox] = useState<RequestItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const includeInbox = isManager && Boolean(departmentName);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setRequests([]);
        setAssignments([]);
        setInbox([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const ws = await fetchUserWorkspace({ includeInbox });
        if (signal?.aborted) return;
        setRequests(ws.requests);
        setAssignments(ws.assignments);
        setInbox(ws.inbox);
        setStats(ws.stats);
      } catch (e) {
        if (signal?.aborted) return;
        setRequests([]);
        setAssignments([]);
        setInbox([]);
        setStats(EMPTY_STATS);
        setError(apiErrorMessage(e, "Could not load your dashboard. Check your connection and try again."));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [userId, includeInbox],
  );

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (!userId) return;

    const onRefresh = (scope: AppRefreshScope) => {
      if (matchesRefreshScope(scope, ["assignments", "workspace", "requests", "all"])) {
        void load();
      }
    };

    return subscribeAppRefresh(onRefresh);
  }, [userId, load]);

  return { requests, inbox, assignments, stats, loading, error, reload: () => load() };
}
