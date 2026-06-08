import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { invalidateNotificationCaches } from "@/lib/notifications-api";
import { cachedApi, invalidateApiCache } from "@/lib/query-cache";
import type { ListTabBucket } from "@/lib/request-status-groups";
import type { Assignment } from "@/types/task";

export type AssignmentDetail = Assignment & { requestId: string };

function invalidateAssignmentCaches() {
  invalidateApiCache("assignments:");
  invalidateApiCache("workspace:");
  invalidateNotificationCaches();
}

export async function fetchMyAssignments(
  params?: { page?: number; limit?: number; tab?: ListTabBucket; q?: string },
  signal?: AbortSignal,
): Promise<PaginatedResponse<AssignmentDetail>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tab = params?.tab ?? "ALL";
  const q = params?.q?.trim() ?? "";
  const key = `assignments:mine:${tab}:${q}:${page}:${limit}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<AssignmentDetail>>("/assignments", {
      params: {
        page,
        limit,
        ...(tab !== "ALL" ? { tab } : {}),
        ...(q ? { q } : {}),
      },
      signal,
    });
    return data;
  }, 15_000);
}

export async function fetchAssignmentDetail(id: string): Promise<AssignmentDetail> {
  const { data } = await api.get<AssignmentDetail>(`/assignments/${id}`);
  return data;
}

export async function createAssignment(payload: {
  requestId: string;
  memberUserIds: string[];
  description?: string;
}): Promise<AssignmentDetail> {
  const { data } = await api.post<AssignmentDetail>("/assignments", payload);
  invalidateAssignmentCaches();
  invalidateApiCache("requests:");
  return data;
}

export async function updateAssignmentStatus(
  id: string,
  status: Assignment["status"] | "NOT_STARTED",
  note?: string,
): Promise<AssignmentDetail> {
  const { data } = await api.patch<AssignmentDetail>(`/assignments/${id}/status`, { status, note });
  invalidateAssignmentCaches();
  invalidateApiCache(`assignment:${id}`);
  return data;
}

export async function addMilestone(
  assignmentId: string,
  payload: {
    title: string;
    ownerUserId: string;
    description?: string;
    deadline?: string;
  },
): Promise<AssignmentDetail> {
  const { data } = await api.post<AssignmentDetail>(`/assignments/${assignmentId}/milestones`, payload);
  invalidateAssignmentCaches();
  invalidateApiCache(`assignment:${assignmentId}`);
  return data;
}

export async function updateMilestone(
  assignmentId: string,
  milestoneId: string,
  payload: { status?: string; progress?: number },
): Promise<AssignmentDetail> {
  const { data } = await api.patch<AssignmentDetail>(
    `/assignments/${assignmentId}/milestones/${milestoneId}`,
    payload,
  );
  invalidateAssignmentCaches();
  invalidateApiCache(`assignment:${assignmentId}`);
  return data;
}
