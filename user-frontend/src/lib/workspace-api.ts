import { api } from "@/lib/api";
import { invalidateApiCache } from "@/lib/query-cache";
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
  const { data } = await api.get<UserWorkspace>("/workspace", {
    params: { includeInbox: params.includeInbox ? "true" : "false" },
  });
  return data;
}

export function invalidateUserWorkspace() {
  invalidateApiCache("workspace:");
}
