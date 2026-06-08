import { ForbiddenException } from '@nestjs/common';
import type { RequestUser } from './auth.types';

export function isManagerRole(roleName: string | null | undefined): boolean {
  return !!roleName && roleName.includes('Manager');
}

export function assertManagerInboxAccess(
  user: RequestUser,
  targetDepartmentName: string,
): void {
  if (!isManagerRole(user.roleName)) {
    throw new ForbiddenException(
      'Manager access required for department inbox',
    );
  }
  const target = targetDepartmentName.trim().toLowerCase();
  const own = user.departmentName?.trim().toLowerCase();
  if (!own || own !== target) {
    throw new ForbiddenException(
      'You can only access your own department inbox',
    );
  }
}

export function assertDepartmentTeamAccess(
  user: RequestUser,
  departmentName: string,
): void {
  const target = departmentName.trim().toLowerCase();
  const own = user.departmentName?.trim().toLowerCase();
  if (!isManagerRole(user.roleName) || !own || own !== target) {
    throw new ForbiddenException(
      'Manager access required for department team list',
    );
  }
}
