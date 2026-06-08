import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/pagination";
import { ADMIN_STATS_CACHE_TTL_MS, cachedApi } from "@/lib/query-cache";

export type DashboardSummaryItem = { label: string; value: string };
export type ReportCard = { label: string; value: string };
export type ActivityItem = {
  id: string;
  description: string;
  createdAt: string;
  requestNumber: string | null;
  userName: string | null;
};

export type SystemEventItem = {
  id: string;
  level: "WARN" | "ERROR";
  code: string;
  message: string;
  httpMethod: string | null;
  path: string | null;
  statusCode: number | null;
  requestId: string | null;
  userName: string | null;
  userEmail: string | null;
  createdAt: string;
};

export type AdminDashboardResponse = {
  summary: DashboardSummaryItem[];
  activity?: ActivityItem[];
};

export async function fetchAdminDashboard(activityLimit?: number): Promise<AdminDashboardResponse> {
  const key = `admin:dashboard:${activityLimit ?? 0}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<AdminDashboardResponse>("/admin/dashboard", {
      params: activityLimit ? { activityLimit } : undefined,
    });
    return data;
  }, ADMIN_STATS_CACHE_TTL_MS);
}

export async function fetchAdminReports(departmentName?: string): Promise<{ cards: ReportCard[] }> {
  const key = `admin:reports:${departmentName ?? "ALL"}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<{ cards: ReportCard[] }>("/admin/reports", {
      params: departmentName ? { departmentName } : undefined,
    });
    return data;
  }, ADMIN_STATS_CACHE_TTL_MS);
}

export async function fetchAdminActivity(limit = 10): Promise<ActivityItem[]> {
  const { data } = await api.get<ActivityItem[]>("/admin/activity", { params: { limit } });
  return data;
}

export type SystemEventsQuery = {
  page?: number;
  limit?: number;
  level?: "ALL" | "ERROR" | "WARN";
};

export async function fetchAdminSystemEvents(
  params: SystemEventsQuery = {},
): Promise<PaginatedResponse<SystemEventItem>> {
  const { page = 1, limit = 20, level } = params;
  const { data } = await api.get<PaginatedResponse<SystemEventItem>>("/admin/system-events", {
    params: {
      page,
      limit,
      ...(level && level !== "ALL" ? { level } : {}),
    },
  });
  return data;
}
