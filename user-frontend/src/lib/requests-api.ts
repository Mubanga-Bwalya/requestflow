import { api } from "@/lib/api";
import { emitAppRefresh } from "@/lib/app-refresh";
import { type PaginatedResponse } from "@/lib/pagination";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { invalidateNotificationCaches } from "@/lib/notifications-api";
import { cacheScopeUserId, cachedApi, invalidateApiCache } from "@/lib/query-cache";
import type { ListTabBucket } from "@/lib/request-status-groups";
import type { Priority, RequestItem, RequestStatus } from "@/types/request";

export type ActivityLogEntry = {
  description: string;
  action: string;
};

export type RequestDetail = {
  id: string;
  requestNumber: string;
  title: string;
  description: string | null;
  department: string;
  sourceDepartment: string;
  requestType: string;
  templateId?: string;
  status: RequestStatus;
  priority: Priority;
  progress: number;
  assignmentId: string | null;
  deadline: string | null;
  currentStage: string | null;
  actionNeeded: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  fieldAnswers: {
    fieldKey: string;
    label: string;
    fieldType: string;
    answerText: string | null;
    answerJson: unknown;
    fileUrl: string | null;
  }[];
  missingInformation: { fieldKey: string | null; label: string }[];
  openMissingRequestId: string | null;
  activity: ActivityLogEntry[];
};

export type CreateRequestPayload = {
  targetDepartmentName: string;
  templateId: string;
  title: string;
  description?: string;
  priority?: Priority;
  deadline?: string;
  fieldAnswers: { fieldKey: string; answerText?: string; answerJson?: unknown; fileUrl?: string }[];
};

function listQueryParams(params?: {
  page?: number;
  limit?: number;
  tab?: ListTabBucket;
  q?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tab = params?.tab;
  const q = params?.q?.trim();
  return {
    page,
    limit,
    ...(tab && tab !== "ALL" ? { tab } : {}),
    ...(q ? { q } : {}),
  };
}

function myRequestsCacheKey(params?: {
  page?: number;
  limit?: number;
  tab?: ListTabBucket;
  q?: string;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tab = params?.tab ?? "ALL";
  const q = params?.q?.trim() ?? "";
  return `requests:mine:${cacheScopeUserId()}:${page}:${limit}:${tab}:${q}`;
}

function deptRequestsCacheKey(
  targetDepartmentName: string,
  params?: { page?: number; limit?: number; tab?: ListTabBucket; q?: string },
) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tab = params?.tab ?? "ALL";
  const q = params?.q?.trim() ?? "";
  return `requests:dept:${cacheScopeUserId()}:${targetDepartmentName}:${page}:${limit}:${tab}:${q}`;
}

export async function fetchMyRequests(
  params?: { page?: number; limit?: number; tab?: ListTabBucket; q?: string },
  signal?: AbortSignal,
): Promise<PaginatedResponse<RequestItem>> {
  const key = myRequestsCacheKey(params);
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<RequestItem>>("/requests", {
      params: listQueryParams(params),
      signal,
    });
    return data;
  });
}

export async function fetchDepartmentRequests(
  targetDepartmentName: string,
  params?: { page?: number; limit?: number; tab?: ListTabBucket; q?: string },
  signal?: AbortSignal,
): Promise<PaginatedResponse<RequestItem>> {
  const key = deptRequestsCacheKey(targetDepartmentName, params);
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<RequestItem>>("/requests", {
      params: { targetDepartmentName, ...listQueryParams(params) },
      signal,
    });
    return data;
  });
}

function invalidateRequestCaches() {
  invalidateApiCache("requests:");
  invalidateApiCache("workspace:");
  invalidateNotificationCaches();
  emitAppRefresh("requests");
}

export async function fetchRequestDetail(id: string): Promise<RequestDetail> {
  return cachedApi(`request:${id}`, async () => {
    const { data } = await api.get<RequestDetail>(`/requests/${id}`);
    return data;
  });
}

export async function createRequest(payload: CreateRequestPayload): Promise<RequestDetail> {
  const { data } = await api.post<RequestDetail>("/requests", payload);
  invalidateRequestCaches();
  return data;
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  note?: string,
): Promise<RequestDetail> {
  const { data } = await api.patch<RequestDetail>(`/requests/${id}/status`, { status, note });
  invalidateRequestCaches();
  invalidateApiCache(`request:${id}`);
  return data;
}

export async function requestMissingInformation(
  id: string,
  items: { fieldKey?: string; reasonLabel: string }[],
  note?: string,
): Promise<RequestDetail> {
  const { data } = await api.post<RequestDetail>(`/requests/${id}/request-missing-information`, {
    items,
    note,
  });
  invalidateRequestCaches();
  invalidateApiCache(`request:${id}`);
  return data;
}

export async function provideMissingInformation(
  id: string,
  fieldAnswers: { fieldKey: string; answerText?: string; answerJson?: unknown }[],
  note?: string,
): Promise<RequestDetail> {
  const { data } = await api.post<RequestDetail>(`/requests/${id}/provide-information`, {
    fieldAnswers,
    note,
  });
  invalidateRequestCaches();
  invalidateApiCache(`request:${id}`);
  return data;
}
