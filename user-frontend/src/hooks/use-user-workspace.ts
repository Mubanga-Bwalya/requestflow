"use client";

import { useCallback, useEffect, useState } from "react";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchUserWorkspace } from "@/lib/workspace-api";
import { peekApiCache, cacheScopeUserId } from "@/lib/query-cache";
import type { Assignment } from "@/types/task";
import type { RequestItem } from "@/types/request";
import type { UserWorkspace } from "@/lib/workspace-api";

const EMPTY_STATS = {
  myRequestsTotal: 0,
  needsResponse: 0,
  tasksToStart: 0,
  inboxActions: 0,
};

function workspaceCacheKey(includeInbox: boolean) {
  return `workspace:${cacheScopeUserId()}:${includeInbox ? "inbox" : "base"}`;
}

function applyWorkspace(ws: UserWorkspace) {
  return {
    requests: ws.requests,
    assignments: ws.assignments,
    inbox: ws.inbox,
    stats: ws.stats,
  };
}

export function useUserWorkspace(
  userId: string | undefined,
  departmentName: string | null | undefined,
  isManager: boolean,
) {
  const includeInbox = isManager && Boolean(departmentName);
  const cacheKey = workspaceCacheKey(includeInbox);
  const cached = peekApiCache<UserWorkspace>(cacheKey);

  const [requests, setRequests] = useState<RequestItem[]>(cached?.requests ?? []);
  const [inbox, setInbox] = useState<RequestItem[]>(cached?.inbox ?? []);
  const [assignments, setAssignments] = useState<Assignment[]>(cached?.assignments ?? []);
  const [stats, setStats] = useState(cached?.stats ?? EMPTY_STATS);
  const [loading, setLoading] = useState(!cached && Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!userId) {
        setRequests([]);
        setAssignments([]);
        setInbox([]);
        setLoading(false);
        return;
      }

      const hit = peekApiCache<UserWorkspace>(cacheKey);
      if (hit) {
        const next = applyWorkspace(hit);
        setRequests(next.requests);
        setAssignments(next.assignments);
        setInbox(next.inbox);
        setStats(next.stats);
        setLoading(false);
      } else {
        setLoading(true);
      }

      setError(null);
      try {
        const ws = await fetchUserWorkspace({ includeInbox });
        if (signal?.aborted) return;
        const next = applyWorkspace(ws);
        setRequests(next.requests);
        setAssignments(next.assignments);
        setInbox(next.inbox);
        setStats(next.stats);
      } catch (e) {
        if (signal?.aborted) return;
        if (!hit) {
          setRequests([]);
          setAssignments([]);
          setInbox([]);
          setStats(EMPTY_STATS);
          setError(apiErrorMessage(e, "Could not load your dashboard. Check your connection and try again."));
        }
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [userId, includeInbox, cacheKey],
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
