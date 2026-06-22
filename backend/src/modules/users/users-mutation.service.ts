import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { AuditLogService } from '../../common/audit-log/audit-log.service';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { mapUserToResponse } from './user-response.mapper';
import {
  resolveUserDepartmentId,
  resolveUserRoleId,
} from './users-resolve.helpers';

@Injectable()
export class UsersMutationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditLogService,
  ) {}

  async create(dto: CreateUserDto, actorId?: string) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing)
      throw new BadRequestException(`Email already in use: ${email}`);

    const departmentId = await resolveUserDepartmentId(
      this.prisma,
      dto.departmentId,
      dto.departmentName,
    );
    if (!departmentId) {
      throw new BadRequestException('Department is required.');
    }
    const roleId = await resolveUserRoleId(
      this.prisma,
      dto.roleId,
      dto.roleName,
    );
    if (!roleId) {
      throw new BadRequestException('Role is required.');
    }

    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        departmentId,
        roleId,
        jobTitle: dto.jobTitle?.trim() || null,
        externalEmployeeId: dto.externalEmployeeId?.trim() || null,
        gn: dto.gn?.trim() || null,
        isActive: dto.isActive ?? true,
      },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    await invalidateAdminStatsCache(this.cache);
    void this.audit.record({
      userId: actorId,
      action: ActivityAction.ADMIN_USER_CHANGED,
      description: `Admin created user ${user.email} (${user.fullName}).`,
    });
    return mapUserToResponse(user);
  }

  async update(id: string, dto: UpdateUserDto, actorId?: string) {
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
        ? await resolveUserDepartmentId(
            this.prisma,
            dto.departmentId,
            dto.departmentName,
          )
        : undefined;
    const roleId =
      dto.roleId !== undefined || dto.roleName !== undefined
        ? await resolveUserRoleId(this.prisma, dto.roleId, dto.roleName)
        : undefined;

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
        ...(dto.gn !== undefined ? { gn: dto.gn?.trim() || null } : {}),
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(roleId !== undefined ? { roleId } : {}),
      },
      include: {
        department: { select: { id: true, name: true } },
        role: { select: { id: true, name: true } },
      },
    });
    await this.cache.del(CacheKeys.authUser(id));
    await invalidateAdminStatsCache(this.cache);
    void this.audit.record({
      userId: actorId,
      action: ActivityAction.ADMIN_USER_CHANGED,
      description: `Admin updated user ${user.email} (${user.fullName}).`,
    });
    return mapUserToResponse(user);
  }
}
