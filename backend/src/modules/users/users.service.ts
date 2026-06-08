import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { allowDemoDefaultPassword, isProduction } from '../../config/env';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { paginatedResult, resolveListPagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { PasswordService } from '../auth/password.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import {
  ASSIGNABLE_USER_ROLE_NAMES,
  isAssignableUserRoleName,
} from '../../common/constants';
import { mapUserToResponse } from './user-response.mapper';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly cache: CacheService,
  ) {}

  private async resolveDepartmentId(
    departmentId?: string,
    departmentName?: string,
  ) {
    if (departmentId) return departmentId;
    if (departmentName) {
      const dept = await this.prisma.department.findFirst({
        where: { name: { equals: departmentName.trim(), mode: 'insensitive' } },
      });
      if (!dept)
        throw new BadRequestException(`Unknown department: ${departmentName}`);
      return dept.id;
    }
    return null;
  }

  private assertAssignableRole(roleName: string) {
    if (!isAssignableUserRoleName(roleName)) {
      throw new BadRequestException(
        `Role must be one of: ${ASSIGNABLE_USER_ROLE_NAMES.join(', ')}`,
      );
    }
  }

  private async resolveRoleId(roleId?: string, roleName?: string) {
    if (roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw new BadRequestException(`Unknown role id: ${roleId}`);
      this.assertAssignableRole(role.name);
      return role.id;
    }
    if (roleName) {
      const role = await this.prisma.role.findFirst({
        where: { name: { equals: roleName.trim(), mode: 'insensitive' } },
      });
      if (!role) throw new BadRequestException(`Unknown role: ${roleName}`);
      this.assertAssignableRole(role.name);
      return role.id;
    }
    return null;
  }

  async findAll(departmentName?: string, page?: number, limit?: number) {
    const where: Prisma.UserWhereInput | undefined = departmentName
      ? {
          department: {
            name: {
              equals: departmentName.trim(),
              mode: Prisma.QueryMode.insensitive,
            },
          },
        }
      : undefined;
    const include = {
      department: { select: { id: true, name: true } },
      role: { select: { id: true, name: true } },
    } as const;

    const pagination = resolveListPagination(page, limit);
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { fullName: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
        include,
      }),
    ]);
    return paginatedResult(
      rows.map((u) => mapUserToResponse(u)),
      total,
      pagination,
    );
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException(`User not found: ${email}`);
    }
    return mapUserToResponse(user);
  }

  async findByDepartment(departmentName: string) {
    const rows = await this.prisma.user.findMany({
      where: {
        isActive: true,
        department: {
          name: { equals: departmentName.trim(), mode: 'insensitive' },
        },
      },
      orderBy: { fullName: 'asc' },
      take: 100,
      include: { role: { select: { name: true } } },
    });
    return rows.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      jobTitle: u.jobTitle,
      roleName: u.role?.name ?? null,
    }));
  }

  async create(dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing)
      throw new BadRequestException(`Email already in use: ${email}`);

    const departmentId = await this.resolveDepartmentId(
      dto.departmentId,
      dto.departmentName,
    );
    if (!departmentId) {
      throw new BadRequestException('Department is required.');
    }
    const roleId = await this.resolveRoleId(dto.roleId, dto.roleName);
    if (!roleId) {
      throw new BadRequestException('Role is required.');
    }

    const plain = AuthService.resolveNewUserPassword(dto.password);
    const passwordHash =
      allowDemoDefaultPassword() && !dto.password?.trim()
        ? await this.passwords.hashUnsafe(plain)
        : await this.passwords.hash(plain);

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        passwordHash,
        departmentId,
        roleId,
        jobTitle: dto.jobTitle?.trim() || null,
        externalEmployeeId: dto.externalEmployeeId?.trim() || null,
        isActive: dto.isActive ?? true,
      },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    return mapUserToResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`User not found: ${id}`);

    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const dup = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' }, NOT: { id } },
      });
      if (dup) throw new BadRequestException(`Email already in use: ${email}`);
    }

    const departmentId =
      dto.departmentId !== undefined || dto.departmentName !== undefined
        ? await this.resolveDepartmentId(dto.departmentId, dto.departmentName)
        : undefined;
    const roleId =
      dto.roleId !== undefined || dto.roleName !== undefined
        ? await this.resolveRoleId(dto.roleId, dto.roleName)
        : undefined;

    let passwordHash: string | undefined;
    if (dto.password !== undefined) {
      const plain = dto.password.trim();
      if (isProduction() && !plain) {
        throw new BadRequestException('Password cannot be empty.');
      }
      const resolved = plain || AuthService.resolveNewUserPassword(undefined);
      passwordHash =
        allowDemoDefaultPassword() && !plain
          ? await this.passwords.hashUnsafe(resolved)
          : await this.passwords.hash(resolved);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined
          ? { fullName: dto.fullName.trim() }
          : {}),
        ...(dto.email !== undefined
          ? { email: dto.email.trim().toLowerCase() }
          : {}),
        ...(dto.jobTitle !== undefined
          ? { jobTitle: dto.jobTitle?.trim() || null }
          : {}),
        ...(dto.externalEmployeeId !== undefined
          ? { externalEmployeeId: dto.externalEmployeeId?.trim() || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(roleId !== undefined ? { roleId } : {}),
        ...(passwordHash !== undefined ? { passwordHash } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    await this.cache.del(CacheKeys.authUser(id));
    return mapUserToResponse(user);
  }
}
