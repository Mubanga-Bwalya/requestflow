import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { invalidateNotificationCaches } from "@/lib/notifications-api";
import { cachedApi, invalidateApiCache } from "@/lib/query-cache";
import type { ListTabBucket } from "@/lib/request-status-groups";
import type { Priority, RequestItem, RequestStatus } from "@/types/request";

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
  activity: string[];
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

export async function fetchMyRequests(
  params?: { page?: number; limit?: number; tab?: ListTabBucket; q?: string },
  signal?: AbortSignal,
): Promise<PaginatedResponse<RequestItem>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tab = params?.tab ?? "ALL";
  const q = params?.q?.trim() ?? "";
  const key = `requests:mine:${tab}:${q}:${page}:${limit}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<RequestItem>>("/requests", {
      params: listQueryParams(params),
      signal,
    });
    return data;
  }, 15_000);
}

export async function fetchDepartmentRequests(
  targetDepartmentName: string,
  params?: { page?: number; limit?: number; tab?: ListTabBucket; q?: string },
  signal?: AbortSignal,
): Promise<PaginatedResponse<RequestItem>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const tab = params?.tab ?? "ALL";
  const q = params?.q?.trim() ?? "";
  const key = `requests:dept:${targetDepartmentName}:${tab}:${q}:${page}:${limit}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<RequestItem>>("/requests", {
      params: { targetDepartmentName, ...listQueryParams(params) },
      signal,
    });
    return data;
  }, 15_000);
}

function invalidateRequestCaches() {
  invalidateApiCache("requests:");
  invalidateApiCache("workspace:");
  invalidateNotificationCaches();
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
