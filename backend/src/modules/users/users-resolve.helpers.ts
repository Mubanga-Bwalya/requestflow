import { BadRequestException } from '@nestjs/common';
import {
  ASSIGNABLE_USER_ROLE_NAMES,
  isAssignableUserRoleName,
} from '../../common/constants';
import type { PrismaService } from '../../prisma/prisma.service';

export async function resolveUserDepartmentId(
  prisma: PrismaService,
  departmentId?: string,
  departmentName?: string,
) {
  if (departmentId) return departmentId;
  if (departmentName) {
    const dept = await prisma.department.findFirst({
      where: { name: { equals: departmentName.trim(), mode: 'insensitive' } },
    });
    if (!dept)
      throw new BadRequestException(`Unknown department: ${departmentName}`);
    return dept.id;
  }
  return null;
}

function assertAssignableRole(roleName: string) {
  if (!isAssignableUserRoleName(roleName)) {
    throw new BadRequestException(
      `Role must be one of: ${ASSIGNABLE_USER_ROLE_NAMES.join(', ')}`,
    );
  }
}

export async function resolveUserRoleId(
  prisma: PrismaService,
  roleId?: string,
  roleName?: string,
) {
  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new BadRequestException(`Unknown role id: ${roleId}`);
    assertAssignableRole(role.name);
    return role.id;
  }
  if (roleName) {
    const role = await prisma.role.findFirst({
      where: { name: { equals: roleName.trim(), mode: 'insensitive' } },
    });
    if (!role) throw new BadRequestException(`Unknown role: ${roleName}`);
    assertAssignableRole(role.name);
    return role.id;
  }
  return null;
}
