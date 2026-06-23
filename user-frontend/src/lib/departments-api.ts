import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { cachedApi } from "@/lib/query-cache";

export type ApiDepartmentSection = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ApiDepartment = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sections?: ApiDepartmentSection[];
};

export async function fetchActiveDepartments(): Promise<ApiDepartment[]> {
  return cachedApi("departments:active", async () => {
    const { data } = await api.get<PaginatedResponse<ApiDepartment>>("/departments", {
      params: { activeOnly: true, page: 1, limit: 100 },
    });
    return data.items;
  }, 60_000);
}
