/** Prisma include for a user's assigned department (leaf), with parent when it is a section. */
export const userDepartmentInclude = {
  select: {
    id: true,
    name: true,
    parentDepartmentId: true,
    parent: { select: { id: true, name: true } },
  },
} as const;

export type UserDepartmentRow = {
  id: string;
  name: string;
  parentDepartmentId: string | null;
  parent: { id: string; name: string } | null;
};

export function splitUserDepartment(dept: UserDepartmentRow | null) {
  if (!dept) {
    return {
      departmentId: null as string | null,
      departmentName: null as string | null,
      sectionId: null as string | null,
      sectionName: null as string | null,
    };
  }
  if (dept.parentDepartmentId) {
    return {
      departmentId: dept.id,
      departmentName: dept.parent?.name ?? null,
      sectionId: dept.id,
      sectionName: dept.name,
    };
  }
  return {
    departmentId: dept.id,
    departmentName: dept.name,
    sectionId: null,
    sectionName: null,
  };
}
