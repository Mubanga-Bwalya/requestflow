import { ForbiddenException } from '@nestjs/common';
import type { RequestUser } from './auth.types';
import { isDepartmentManagerByName } from './department-manager';

export { assertManagerInboxAccess } from './manager-inbox';

export function isManagerRole(roleName: string | null | undefined): boolean {
  return !!roleName && roleName.includes('Manager');
}

export function assertDepartmentTeamAccess(
  user: RequestUser,
  departmentName: string,
): void {
  if (!isDepartmentManagerByName(departmentName, user.managedDepartmentNames)) {
    throw new ForbiddenException(
      'Department manager access required for department team list.',
    );
  }
}
