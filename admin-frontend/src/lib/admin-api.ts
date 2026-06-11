import { api } from "@/lib/api";
import type { PaginatedResponse } from "@/lib/pagination";
import { ADMIN_STATS_CACHE_TTL_MS, cachedApi, invalidateApiCache } from "@/lib/query-cache";

export type DashboardSummaryItem = { label: string; value: string };
export type ReportBreakdownItem = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type ReportInsight = {
  severity: "high" | "medium" | "info";
  title: string;
  detail: string;
};

export type AdminReportsData = {
  departmentFilter: string | null;
  kpis: {
    totalRequests: number;
    activeRequests: number;
    completedThisMonth: number;
    completedLastMonth: number;
    overdue: number;
    avgProgress: number;
    awaitingAcceptance: number;
    needsInformation: number;
    readyForReview: number;
    submittedThisMonth: number;
  };
  statusBreakdown: ReportBreakdownItem[];
  departmentBreakdown: ReportBreakdownItem[];
  priorityBreakdown: ReportBreakdownItem[];
  insights: ReportInsight[];
};
export type ActivityItem = {
  id: string;
  description: string;
  createdAt: string;
  requestNumber: string | null;
  userName: string | null;
};

export type ActivityLogItem = ActivityItem & {
  action: string;
  userEmail: string | null;
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
  context: Record<string, unknown> | null;
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

function isAdminReportsData(data: unknown): data is AdminReportsData {
  if (!data || typeof data !== "object") return false;
  const row = data as AdminReportsData;
  return !!row.kpis && Array.isArray(row.insights) && Array.isArray(row.statusBreakdown);
}

export async function fetchAdminReports(departmentName?: string): Promise<AdminReportsData> {
  const key = `admin:reports:v2:${departmentName ?? "ALL"}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<AdminReportsData>("/admin/reports", {
      params: departmentName ? { departmentName } : undefined,
    });
    if (!isAdminReportsData(data)) {
      invalidateApiCache(key);
      throw new Error("Reports API returned an unexpected response. Restart the backend and refresh.");
    }
    return data;
  }, ADMIN_STATS_CACHE_TTL_MS);
}

export async function fetchAdminActivity(limit = 10): Promise<ActivityItem[]> {
  const { data } = await api.get<ActivityItem[]>("/admin/activity", { params: { limit } });
  return data;
}

export async function fetchAdminActivityLogs(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse<ActivityLogItem>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const { data } = await api.get<PaginatedResponse<ActivityLogItem>>("/admin/activity", {
    params: { page, limit },
  });
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
