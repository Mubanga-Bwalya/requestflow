export function mapUserToResponse(row: {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  externalEmployeeId?: string | null;
  isActive: boolean;
  department: { id: string; name: string } | null;
  role: { id: string; name: string } | null;
}) {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    jobTitle: row.jobTitle,
    externalEmployeeId: row.externalEmployeeId ?? null,
    isActive: row.isActive,
    departmentId: row.department?.id ?? null,
    departmentName: row.department?.name ?? null,
    roleId: row.role?.id ?? null,
    roleName: row.role?.name ?? null,
  };
}
