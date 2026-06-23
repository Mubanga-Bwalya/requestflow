import { splitUserDepartment, type UserDepartmentRow } from './user-department.include';

export function mapUserToResponse(row: {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  externalEmployeeId?: string | null;
  gn?: string | null;
  isActive: boolean;
  department: UserDepartmentRow | null;
  role: { id: string; name: string } | null;
}) {
  const dept = splitUserDepartment(row.department);
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    jobTitle: row.jobTitle,
    externalEmployeeId: row.externalEmployeeId ?? null,
    gn: row.gn ?? null,
    isActive: row.isActive,
    departmentId: dept.departmentId,
    departmentName: dept.departmentName,
    sectionId: dept.sectionId,
    sectionName: dept.sectionName,
    roleId: row.role?.id ?? null,
    roleName: row.role?.name ?? null,
  };
}
