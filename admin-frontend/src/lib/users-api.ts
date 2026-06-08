import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { cachedApi, invalidateApiCache } from "@/lib/query-cache";

export type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  externalEmployeeId: string | null;
  isActive: boolean;
  departmentId: string | null;
  departmentName: string | null;
  roleId: string | null;
  roleName: string | null;
};

export async function fetchUsers(params?: {
  page?: number;
  limit?: number;
  departmentName?: string;
}): Promise<PaginatedResponse<ApiUser>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const dept = params?.departmentName && params.departmentName !== "ALL" ? params.departmentName : undefined;
  const key = `users:page:${page}:${limit}:${dept ?? "ALL"}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<ApiUser>>("/users", {
      params: { page, limit, ...(dept ? { departmentName: dept } : {}) },
    });
    return data;
  }, 15_000);
}

export async function fetchDepartmentUsers(departmentName: string) {
  return cachedApi(`users:dept:${departmentName}`, async () => {
    const { data } = await api.get<
      PaginatedResponse<{ id: string; fullName: string; email: string; roleName: string | null }>
    >("/users", {
      params: { departmentName, page: 1, limit: 100 },
    });
    return data.items;
  }, 10_000);
}

export async function createUser(payload: {
  fullName: string;
  email: string;
  departmentName: string;
  roleName: string;
  jobTitle?: string;
  externalEmployeeId?: string;
  password?: string;
  isActive?: boolean;
}): Promise<ApiUser> {
  const { data } = await api.post<ApiUser>("/users", payload);
  invalidateApiCache("users:");
  invalidateApiCache("users:page:");
  invalidateApiCache("admin:");
  return data;
}

export async function updateUser(
  id: string,
  payload: Partial<{
    fullName: string;
    email: string;
    departmentName: string;
    roleName: string;
    jobTitle: string | null;
    externalEmployeeId: string | null;
    password?: string;
    isActive: boolean;
  }>,
): Promise<ApiUser> {
  const { data } = await api.patch<ApiUser>(`/users/${id}`, payload);
  invalidateApiCache("users:");
  invalidateApiCache("users:page:");
  invalidateApiCache("admin:");
  return data;
}
