import { api } from "@/lib/api";

export type DepartmentUser = {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  roleName: string | null;
};

export async function fetchDepartmentUsers(departmentName: string): Promise<DepartmentUser[]> {
  const { data } = await api.get<DepartmentUser[]>("/users", { params: { departmentName } });
  return data;
}
