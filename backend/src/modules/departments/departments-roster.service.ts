import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { mapDepartmentRow } from './departments.mapper';
import { DepartmentsQueryService } from './departments-query.service';
import { userDepartmentInclude } from '../users/user-department.include';
import { mapUserToResponse } from '../users/user-response.mapper';

export type DepartmentRosterUser = ReturnType<typeof mapUserToResponse>;

export type DepartmentRosterSection = {
  id: string;
  name: string;
  isActive: boolean;
  manager: { id: string; fullName: string; email: string } | null;
  userCount: number;
  users: DepartmentRosterUser[];
};

export type DepartmentRoster = {
  department: ReturnType<typeof mapDepartmentRow>;
  sections: DepartmentRosterSection[];
  /** Users assigned directly to the top-level department (no sub-section). */
  departmentUsers: DepartmentRosterUser[];
};

@Injectable()
export class DepartmentsRosterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly query: DepartmentsQueryService,
    private readonly cache: CacheService,
  ) {}

  async getRoster(departmentId: string): Promise<DepartmentRoster> {
    const department = await this.query.findOne(departmentId);
    if (department.parentDepartmentId) {
      throw new BadRequestException(
        'Roster is only available for top-level departments.',
      );
    }

    const sectionIds = department.sections.map((s) => s.id);
    const rosterDeptIds = [department.id, ...sectionIds];

    const users = await this.prisma.user.findMany({
      where: { departmentId: { in: rosterDeptIds } },
      orderBy: { fullName: 'asc' },
      include: {
        department: userDepartmentInclude,
        role: { select: { id: true, name: true } },
      },
    });

    const usersByDeptId = new Map<string, DepartmentRosterUser[]>();
    for (const user of users) {
      const deptId = user.departmentId;
      if (!deptId) continue;
      const mapped = mapUserToResponse(user);
      const bucket = usersByDeptId.get(deptId) ?? [];
      bucket.push(mapped);
      usersByDeptId.set(deptId, bucket);
    }

    return {
      department,
      sections: department.sections.map((section) => ({
        id: section.id,
        name: section.name,
        isActive: section.isActive,
        manager: section.manager
          ? {
              id: section.manager.id,
              fullName: section.manager.fullName,
              email: section.manager.email,
            }
          : null,
        userCount: usersByDeptId.get(section.id)?.length ?? 0,
        users: usersByDeptId.get(section.id) ?? [],
      })),
      departmentUsers: usersByDeptId.get(department.id) ?? [],
    };
  }

  async assignSectionMembers(
    parentDepartmentId: string,
    sectionId: string,
    userIds: string[],
  ): Promise<{ assigned: number }> {
    const uniqueIds = [...new Set(userIds)];
    const section = await this.prisma.department.findFirst({
      where: { id: sectionId, parentDepartmentId: parentDepartmentId },
      select: { id: true, name: true },
    });
    if (!section) {
      throw new NotFoundException('Sub-section not found for this department.');
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, departmentId: true },
    });
    if (users.length !== uniqueIds.length) {
      throw new BadRequestException('One or more users were not found.');
    }

    const allowedDeptIds = new Set<string>([parentDepartmentId]);
    const siblings = await this.prisma.department.findMany({
      where: { parentDepartmentId: parentDepartmentId },
      select: { id: true },
    });
    for (const s of siblings) allowedDeptIds.add(s.id);

    const invalid = users.filter(
      (u) => !u.departmentId || !allowedDeptIds.has(u.departmentId),
    );
    if (invalid.length) {
      throw new BadRequestException(
        'Users must belong to this department or one of its sub-sections before they can be reassigned.',
      );
    }

    await this.prisma.user.updateMany({
      where: { id: { in: uniqueIds } },
      data: { departmentId: sectionId },
    });

    await Promise.all(
      uniqueIds.map((userId) => this.cache.del(CacheKeys.authUser(userId))),
    );
    await invalidateAdminStatsCache(this.cache);

    return { assigned: uniqueIds.length };
  }

  async unassignSectionMembers(
    parentDepartmentId: string,
    sectionId: string,
    userIds: string[],
  ): Promise<{ moved: number }> {
    const uniqueIds = [...new Set(userIds)];
    const section = await this.prisma.department.findFirst({
      where: { id: sectionId, parentDepartmentId: parentDepartmentId },
      select: { id: true },
    });
    if (!section) {
      throw new NotFoundException('Sub-section not found for this department.');
    }

    const result = await this.prisma.user.updateMany({
      where: { id: { in: uniqueIds }, departmentId: sectionId },
      data: { departmentId: parentDepartmentId },
    });

    await Promise.all(
      uniqueIds.map((userId) => this.cache.del(CacheKeys.authUser(userId))),
    );
    await invalidateAdminStatsCache(this.cache);

    return { moved: result.count };
  }
}
