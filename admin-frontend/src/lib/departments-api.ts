import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { cachedApi, invalidateApiCache } from "@/lib/query-cache";

export type ApiDepartmentManager = { id: string; fullName: string; email: string } | null;

export type ApiDepartmentSection = {
  id: string;
  name: string;
  description: string | null;
  externalDepartmentCode: string | null;
  parentDepartmentId: string | null;
  isActive: boolean;
  manager: ApiDepartmentManager;
  userCount: number;
  activeRequestCount: number;
  templateCount: number;
};

export type ApiDepartment = {
  id: string;
  name: string;
  description: string | null;
  externalDepartmentCode: string | null;
  parentDepartmentId: string | null;
  parentName: string | null;
  isActive: boolean;
  manager: ApiDepartmentManager;
  userCount: number;
  activeRequestCount: number;
  templateCount: number;
  /** Sub-sections (child departments). Present on top-level departments. */
  sections: ApiDepartmentSection[];
};

/** All active departments (for dropdowns) — unpaginated. */
export async function fetchDepartments(activeOnly = false): Promise<ApiDepartment[]> {
  const key = `departments:${activeOnly ? "active" : "all"}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<ApiDepartment>>("/departments", {
      params: { activeOnly, page: 1, limit: 100 },
    });
    return data.items;
  });
}

export async function fetchDepartmentsPage(params?: {
  page?: number;
  limit?: number;
  activeOnly?: boolean;
}): Promise<PaginatedResponse<ApiDepartment>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const activeOnly = params?.activeOnly ?? false;
  const key = `departments:page:${page}:${limit}:${activeOnly}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<ApiDepartment>>("/departments", {
      params: { page, limit, activeOnly },
    });
    return data;
  }, 15_000);
}

export async function createDepartment(payload: {
  name: string;
  description?: string;
  externalDepartmentCode?: string;
  isActive?: boolean;
  cloneTemplatesFromDepartmentId?: string;
  /** Set to create a sub-section under this top-level department. */
  parentDepartmentId?: string;
  /** Optional manager to assign on creation (used for sections). */
  managerUserId?: string;
}): Promise<ApiDepartment> {
  const { data } = await api.post<ApiDepartment>("/departments", payload);
  invalidateDepartmentCaches();
  return data;
}

export async function updateDepartment(
  id: string,
  payload: {
    name?: string;
    description?: string | null;
    externalDepartmentCode?: string | null;
    isActive?: boolean;
    managerUserId?: string | null;
    /** Re-parent under a top-level department, or null to make top-level. */
    parentDepartmentId?: string | null;
  },
): Promise<ApiDepartment> {
  const { data } = await api.patch<ApiDepartment>(`/departments/${id}`, payload);
  invalidateDepartmentCaches();
  return data;
}

export function invalidateDepartmentCaches() {
  invalidateApiCache("departments:");
  invalidateApiCache("departments:page:");
  invalidateApiCache("users:");
  invalidateApiCache("users:page:");
  invalidateApiCache("templates:");
  invalidateApiCache("admin:");
}

/** @deprecated Use updateDepartment */
export async function updateDepartmentManager(id: string, managerUserId: string | null): Promise<ApiDepartment> {
  return updateDepartment(id, { managerUserId });
}
