"use client";

import { useEffect, useState } from "react";
import { peekApiCache } from "@/lib/query-cache";
import { fetchUserWorkspace, type UserWorkspace } from "@/lib/workspace-api";
import type { Assignment } from "@/types/task";
import type { RequestItem } from "@/types/request";

export function useUserWorkspace(
  userId: string | undefined,
  departmentName: string | null | undefined,
  isManager: boolean,
) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [inbox, setInbox] = useState<RequestItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState({
    myRequestsTotal: 0,
    needsResponse: 0,
    tasksToStart: 0,
    inboxActions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dept = departmentName;
    if (!userId) {
      setRequests([]);
      setAssignments([]);
      setInbox([]);
      setLoading(false);
      return;
    }

    const cacheKey = `workspace:${isManager && dept ? "inbox" : "base"}`;
    const cached = peekApiCache<UserWorkspace>(cacheKey);
    if (cached) {
      setRequests(cached.requests);
      setAssignments(cached.assignments);
      setInbox(cached.inbox);
      setStats(cached.stats);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;
    fetchUserWorkspace({
      includeInbox: isManager && Boolean(dept),
    })
      .then((ws) => {
        if (cancelled) return;
        setRequests(ws.requests);
        setAssignments(ws.assignments);
        setInbox(ws.inbox);
        setStats(ws.stats);
      })
      .catch(() => {
        if (!cancelled && !cached) {
          setRequests([]);
          setAssignments([]);
          setInbox([]);
          setStats({ myRequestsTotal: 0, needsResponse: 0, tasksToStart: 0, inboxActions: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, departmentName, isManager]);

  return { requests, inbox, assignments, stats, loading };
}
