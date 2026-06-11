import type { PrismaService } from '../prisma/prisma.service';

export type ManagedDepartments = {
  ids: string[];
  names: string[];
};

/** Whether the user is manually assigned as manager of the given department. */
export function isDepartmentManager(
  userId: string,
  departmentId: string,
  managedDepartmentIds: readonly string[],
): boolean {
  return managedDepartmentIds.includes(departmentId);
}

export function isDepartmentManagerByName(
  targetDepartmentName: string,
  managedDepartmentNames: readonly string[],
): boolean {
  const target = targetDepartmentName.trim().toLowerCase();
  return managedDepartmentNames.some(
    (name) => name.trim().toLowerCase() === target,
  );
}

/** Active departments where `manager_user_id` points at this user. */
export async function loadManagedDepartments(
  prisma: PrismaService,
  userId: string,
): Promise<ManagedDepartments> {
  const rows = await prisma.department.findMany({
    where: { managerUserId: userId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
  return {
    ids: rows.map((r) => r.id),
    names: rows.map((r) => r.name),
  };
}
