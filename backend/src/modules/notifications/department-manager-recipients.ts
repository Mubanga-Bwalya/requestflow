import type { PrismaService } from '../../prisma/prisma.service';

/** Department manager inbox recipients: assigned manager + active users with a Manager role. */
export async function resolveDepartmentManagerRecipientIds(
  prisma: PrismaService,
  departmentId: string,
  managerUserId: string | null | undefined,
): Promise<string[]> {
  const ids = new Set<string>();
  if (managerUserId) ids.add(managerUserId);

  const managers = await prisma.user.findMany({
    where: {
      departmentId,
      isActive: true,
      role: { name: { contains: 'Manager', mode: 'insensitive' } },
    },
    select: { id: true },
  });
  for (const row of managers) ids.add(row.id);

  return [...ids];
}
