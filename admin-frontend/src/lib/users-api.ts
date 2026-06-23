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
  gn: string | null;
  isActive: boolean;
  departmentId: string | null;
  departmentName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  roleId: string | null;
  roleName: string | null;
};

export async function syncUsersDirectory(): Promise<{ ok: boolean; message: string }> {
  const { data } = await api.post<{ ok: boolean; message: string }>("/users/sync-directory");
  invalidateApiCache("users:");
  invalidateApiCache("users:page:");
  invalidateApiCache("departments:");
  return data;
}

export async function fetchUsers(
  params?: {
    page?: number;
    limit?: number;
    departmentName?: string;
    refreshDirectory?: boolean;
    search?: string;
    status?: "ALL" | "Active" | "Inactive";
  },
  signal?: AbortSignal,
): Promise<PaginatedResponse<ApiUser>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? LIST_PAGE_SIZE;
  const dept = params?.departmentName && params.departmentName !== "ALL" ? params.departmentName : undefined;
  const refreshDirectory = params?.refreshDirectory === true;
  const search = params?.search?.trim() || undefined;
  const status =
    params?.status === "Active" ? "active" : params?.status === "Inactive" ? "inactive" : undefined;
  const key = `users:page:${page}:${limit}:${dept ?? "ALL"}:${search ?? ""}:${status ?? "ALL"}`;

  const load = async () => {
    const { data } = await api.get<PaginatedResponse<ApiUser>>("/users", {
      params: {
        page,
        limit,
        ...(dept ? { departmentName: dept } : {}),
        ...(refreshDirectory ? { refreshDirectory: "true" } : {}),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      },
      signal,
    });
    return data;
  };

  if (refreshDirectory || signal) {
    if (refreshDirectory) invalidateApiCache("users:page:");
    return load();
  }

  return cachedApi(key, load, 15_000);
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
  gn?: string;
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
    gn: string | null;
    isActive: boolean;
  }>,
): Promise<ApiUser> {
  const { data } = await api.patch<ApiUser>(`/users/${id}`, payload);
  invalidateApiCache("users:");
  invalidateApiCache("users:page:");
  invalidateApiCache("admin:");
  return data;
}
