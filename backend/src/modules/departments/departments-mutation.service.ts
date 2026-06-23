import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateDepartmentDto } from './dto/create-department.dto';
import type { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsQueryService } from './departments-query.service';

@Injectable()
export class DepartmentsMutationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly query: DepartmentsQueryService,
  ) {}

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

  /**
   * Validate a candidate parent for a (sub-)section. Enforces the two-level rule:
   * the parent must exist, be top-level (not itself a section), and not be the
   * department being edited. Returns the validated parent id.
   */
  private async assertValidParent(
    parentDepartmentId: string,
    selfId?: string,
  ): Promise<string> {
    if (selfId && parentDepartmentId === selfId) {
      throw new BadRequestException('A department cannot be its own parent.');
    }
    const parent = await this.prisma.department.findUnique({
      where: { id: parentDepartmentId },
      select: { id: true, parentDepartmentId: true },
    });
    if (!parent) {
      throw new BadRequestException(
        `Parent department not found: ${parentDepartmentId}`,
      );
    }
    if (parent.parentDepartmentId) {
      throw new BadRequestException(
        'Sections can only be nested one level deep — the parent must be a top-level department.',
      );
    }
    return parent.id;
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

    const parentDepartmentId = dto.parentDepartmentId
      ? await this.assertValidParent(dto.parentDepartmentId)
      : null;

    if (dto.managerUserId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: dto.managerUserId },
      });
      if (!manager)
        throw new BadRequestException(`User not found: ${dto.managerUserId}`);
    }

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
          parentDepartmentId,
          managerUserId: dto.managerUserId ?? null,
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
    return this.query.findOne(created.id);
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

    let parentDepartmentId: string | null | undefined;
    if (dto.parentDepartmentId !== undefined) {
      if (dto.parentDepartmentId === null) {
        parentDepartmentId = null; // promote to top-level
      } else {
        // A department with its own sections cannot become a section itself.
        const childCount = await this.prisma.department.count({
          where: { parentDepartmentId: id },
        });
        if (childCount > 0) {
          throw new BadRequestException(
            'This department has sub-sections, so it cannot become a section itself. Move its sections first.',
          );
        }
        parentDepartmentId = await this.assertValidParent(
          dto.parentDepartmentId,
          id,
        );
      }
    }

    if (dto.isActive === false) {
      const activeCount = await this.query.activeRequestCount(id);
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
        ...(parentDepartmentId !== undefined ? { parentDepartmentId } : {}),
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
    return this.query.findOne(id);
  }
}
