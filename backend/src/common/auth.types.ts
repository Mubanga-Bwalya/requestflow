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
};
