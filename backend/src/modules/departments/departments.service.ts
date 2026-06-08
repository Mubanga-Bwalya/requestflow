import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { paginatedResult, resolveListPagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';

const TERMINAL_STATUSES: RequestStatus[] = [
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async activeRequestCount(departmentId: string) {
    return this.prisma.request.count({
      where: {
        targetDepartmentId: departmentId,
        status: { notIn: TERMINAL_STATUSES },
      },
    });
  }

  private mapRow(
    d: {
      id: string;
      name: string;
      description: string | null;
      externalDepartmentCode: string | null;
      isActive: boolean;
      manager: {
        id: string;
        fullName: string;
        email: string;
        jobTitle: string | null;
      } | null;
      _count: { templates: number; users: number };
    },
    activeRequestCount: number,
  ) {
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      externalDepartmentCode: d.externalDepartmentCode,
      isActive: d.isActive,
      manager: d.manager
        ? {
            id: d.manager.id,
            fullName: d.manager.fullName,
            email: d.manager.email,
            jobTitle: d.manager.jobTitle,
          }
        : null,
      templateCount: d._count.templates,
      userCount: d._count.users,
      activeRequestCount,
    };
  }

  private async activeRequestCountsByDepartment(): Promise<
    Map<string, number>
  > {
    const groups = await this.prisma.request.groupBy({
      by: ['targetDepartmentId'],
      where: { status: { notIn: TERMINAL_STATUSES } },
      _count: { _all: true },
    });
    return new Map(groups.map((g) => [g.targetDepartmentId, g._count._all]));
  }

  private departmentInclude() {
    return {
      manager: {
        select: { id: true, fullName: true, email: true, jobTitle: true },
      },
      _count: { select: { templates: true, users: true } },
    } as const;
  }

  async findAll(activeOnly = true, page?: number, limit?: number) {
    const where = activeOnly ? { isActive: true } : undefined;
    const activeCounts = await this.activeRequestCountsByDepartment();

    const pagination = resolveListPagination(page, limit);
    const [total, rows] = await Promise.all([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: this.departmentInclude(),
      }),
    ]);
    return paginatedResult(
      rows.map((d) => this.mapRow(d, activeCounts.get(d.id) ?? 0)),
      total,
      pagination,
    );
  }

  async findOne(id: string) {
    const d = await this.prisma.department.findUnique({
      where: { id },
      include: this.departmentInclude(),
    });

    if (!d) {
      throw new NotFoundException(`Department not found: ${id}`);
    }

    return this.mapRow(d, await this.activeRequestCount(d.id));
  }

  private async cloneTemplatesFrom(
    sourceDeptId: string,
    targetDeptId: string,
    tx: Prisma.TransactionClient,
  ) {
    const sourceTemplates = await tx.requestTemplate.findMany({
      where: { departmentId: sourceDeptId, isActive: true },
      include: { fields: { where: { isActive: true } } },
    });

    for (const src of sourceTemplates) {
      const created = await tx.requestTemplate.create({
        data: {
          departmentId: targetDeptId,
          name: src.name,
          description: src.description,
          isActive: true,
        },
      });
      for (const field of src.fields) {
        await tx.templateField.create({
          data: {
            templateId: created.id,
            label: field.label,
            fieldKey: field.fieldKey,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            options: field.options === null ? Prisma.JsonNull : field.options,
            helpText: field.helpText,
            displayOrder: field.displayOrder,
            isActive: true,
          },
        });
      }
    }
  }

  async create(dto: CreateDepartmentDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Department name is required.');
    if (name.length < 2) {
      throw new BadRequestException(
        'Department name must be at least 2 characters.',
      );
    }

    const existing = await this.prisma.department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (existing)
      throw new BadRequestException(`Department already exists: ${name}`);

    if (dto.cloneTemplatesFromDepartmentId) {
      const source = await this.prisma.department.findUnique({
        where: { id: dto.cloneTemplatesFromDepartmentId },
      });
      if (!source)
        throw new BadRequestException(
          'Source department for template clone not found.',
        );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const dept = await tx.department.create({
        data: {
          name,
          description: dto.description?.trim() || null,
          externalDepartmentCode: dto.externalDepartmentCode?.trim() || null,
          isActive: dto.isActive ?? true,
        },
      });

      if (dto.cloneTemplatesFromDepartmentId) {
        await this.cloneTemplatesFrom(
          dto.cloneTemplatesFromDepartmentId,
          dept.id,
          tx,
        );
      }

      return dept;
    });

    await invalidateAdminStatsCache(this.cache);
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Department not found: ${id}`);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name)
        throw new BadRequestException('Department name cannot be empty.');
      if (name.length < 2) {
        throw new BadRequestException(
          'Department name must be at least 2 characters.',
        );
      }
      const dup = await this.prisma.department.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, NOT: { id } },
      });
      if (dup)
        throw new BadRequestException(
          `Department name already in use: ${name}`,
        );
    }

    if (dto.managerUserId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: dto.managerUserId },
      });
      if (!manager)
        throw new BadRequestException(`User not found: ${dto.managerUserId}`);
    }

    if (dto.isActive === false) {
      const activeCount = await this.activeRequestCount(id);
      if (activeCount > 0) {
        throw new BadRequestException(
          'Cannot deactivate department while it has active requests. Complete or reassign them first.',
        );
      }
    }

    await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.externalDepartmentCode !== undefined
          ? {
              externalDepartmentCode:
                dto.externalDepartmentCode?.trim() || null,
            }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.managerUserId !== undefined
          ? { managerUserId: dto.managerUserId }
          : {}),
      },
    });

    if (dto.managerUserId !== undefined) {
      const authKeys = new Set<string>();
      if (existing.managerUserId) authKeys.add(existing.managerUserId);
      if (dto.managerUserId) authKeys.add(dto.managerUserId);
      await Promise.all(
        [...authKeys].map((userId) =>
          this.cache.del(CacheKeys.authUser(userId)),
        ),
      );
    }

    await invalidateAdminStatsCache(this.cache);
    return this.findOne(id);
  }
}
