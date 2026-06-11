export type JwtPayload = {
  sub: string;
  email: string;
  roleName: string | null;
  departmentName: string | null;
};

export type RequestUser = {
  id: string;
  email: string;
  roleName: string | null;
  departmentName: string | null;
  departmentId: string | null;
  /** First managed department name (legacy inbox default); use managedDepartmentNames for checks. */
  inboxDepartmentName: string | null;
  /** Departments where this user is manually assigned as manager (`departments.manager_user_id`). */
  managedDepartmentIds: string[];
  managedDepartmentNames: string[];
};
