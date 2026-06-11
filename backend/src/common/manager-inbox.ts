import { ForbiddenException } from '@nestjs/common';
import {
  isDepartmentManagerByName,
  loadManagedDepartments,
} from './department-manager';
import type { PrismaService } from '../prisma/prisma.service';

/** @deprecated Use loadManagedDepartments — kept for auth login profile helper. */
export async function resolveManagerInboxDepartmentName(
  prisma: PrismaService,
  userId: string,
): Promise<string | null> {
  const managed = await loadManagedDepartments(prisma, userId);
  return managed.names[0] ?? null;
}

export function assertManagerInboxAccess(
  managedDepartmentNames: readonly string[],
  targetDepartmentName: string,
): void {
  if (
    !isDepartmentManagerByName(targetDepartmentName, managedDepartmentNames)
  ) {
    throw new ForbiddenException(
      'You can only access inboxes for departments you manage.',
    );
  }
}
