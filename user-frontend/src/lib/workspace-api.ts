import { api } from "@/lib/api";
import { cachedApi, invalidateApiCache, WORKSPACE_CACHE_TTL_MS } from "@/lib/query-cache";
import type { Assignment } from "@/types/task";
import type { RequestItem } from "@/types/request";

export type UserWorkspace = {
  stats: {
    myRequestsTotal: number;
    needsResponse: number;
    tasksToStart: number;
    inboxActions: number;
  };
  requests: RequestItem[];
  assignments: (Assignment & { requestId?: string; milestoneCount?: number })[];
  inbox: RequestItem[];
  unreadNotificationCount: number;
};

export async function fetchUserWorkspace(params: {
  includeInbox: boolean;
}): Promise<UserWorkspace> {
  const key = `workspace:${params.includeInbox ? "inbox" : "base"}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<UserWorkspace>("/workspace", {
      params: { includeInbox: params.includeInbox ? "true" : "false" },
    });
    return data;
  }, WORKSPACE_CACHE_TTL_MS);
}

export function invalidateUserWorkspace() {
  invalidateApiCache("workspace:");
}
