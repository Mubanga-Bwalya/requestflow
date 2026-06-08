import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';

/** Invalidate workspace summary for everyone affected by an assignment change. */
export async function invalidateWorkspaceForAssignment(
  cache: CacheService,
  prisma: PrismaService,
  params: {
    requesterId: string;
    memberUserIds: string[];
    departmentId: string;
    actorId?: string;
  },
): Promise<void> {
  const userIds = new Set([
    params.requesterId,
    ...params.memberUserIds,
    ...(params.actorId ? [params.actorId] : []),
  ]);

  const dept = await prisma.department.findUnique({
    where: { id: params.departmentId },
    select: { managerUserId: true },
  });
  if (dept?.managerUserId) userIds.add(dept.managerUserId);

  await Promise.all(
    [...userIds].map((id) => cache.del(CacheKeys.workspaceSummary(id))),
  );
}
