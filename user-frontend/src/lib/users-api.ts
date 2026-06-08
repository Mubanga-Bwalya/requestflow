import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";

export type DepartmentUser = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  roleName: string | null;
};

/** Active users in a department for team pickers (paginated; default first 100). */
export async function fetchDepartmentUsers(departmentName: string): Promise<DepartmentUser[]> {
  const { data } = await api.get<PaginatedResponse<DepartmentUser>>("/users", {
    params: { departmentName, page: 1, limit: 100 },
  });
  return data.items;
}
