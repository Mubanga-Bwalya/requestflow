import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  paginatedResult,
  resolveListPagination,
  type PaginatedResult,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import { loadTemplateDetail } from './template-detail.loader';

export type ListTemplatesQuery = {
  departmentId?: string;
  departmentName?: string;
  activeOnly?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

type TemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  fieldCount: number;
};

@Injectable()
export class RequestTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  private templateWhere(
    query: ListTemplatesQuery,
  ): Prisma.RequestTemplateWhereInput {
    const { departmentId, departmentName, activeOnly = true, isActive } = query;
    return {
      ...(isActive !== undefined
        ? { isActive }
        : activeOnly
          ? { isActive: true }
          : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(departmentName
        ? {
            department: {
              name: { equals: departmentName, mode: 'insensitive' },
            },
          }
        : {}),
    };
  }

  private mapTemplateSummary(t: {
    id: string;
    name: string;
    description: string | null;
    departmentId: string;
    isActive: boolean;
    department: { name: string };
    fields: { id: string }[];
  }): TemplateSummary {
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      departmentId: t.departmentId,
      departmentName: t.department.name,
      isActive: t.isActive,
      fieldCount: t.fields.length,
    };
  }

  async findAll(
    query: ListTemplatesQuery = {},
  ): Promise<TemplateSummary[] | PaginatedResult<TemplateSummary>> {
    const where = this.templateWhere(query);
    const include = {
      department: { select: { id: true, name: true } },
      fields:
        query.activeOnly !== false
          ? { where: { isActive: true }, select: { id: true } }
          : { select: { id: true } },
    };

    const pagination = resolveListPagination(query.page, query.limit);
    const [total, rows] = await Promise.all([
      this.prisma.requestTemplate.count({ where }),
      this.prisma.requestTemplate.findMany({
        where,
        orderBy: [{ department: { name: 'asc' } }, { name: 'asc' }],
        skip: pagination.skip,
        take: pagination.limit,
        include,
      }),
    ]);
    return paginatedResult(
      rows.map((t) => this.mapTemplateSummary(t)),
      total,
      pagination,
    );
  }

  async create(dto: CreateTemplateDto) {
    const name = dto.name?.trim();
    if (!name) throw new BadRequestException('Template name is required.');

    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!dept)
      throw new NotFoundException(`Department not found: ${dto.departmentId}`);

    const dup = await this.prisma.requestTemplate.findFirst({
      where: {
        departmentId: dto.departmentId,
        name: { equals: name, mode: 'insensitive' },
      },
    });
    if (dup)
      throw new BadRequestException(
        `A template named "${name}" already exists in this department.`,
      );

    const created = await this.prisma.requestTemplate.create({
      data: {
        departmentId: dto.departmentId,
        name,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      },
    });

    return this.findOne(created.id, false);
  }

  async findOne(id: string, activeFieldsOnly = true) {
    return loadTemplateDetail(this.prisma, id, activeFieldsOnly);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const existing = await this.prisma.requestTemplate.findUnique({
      where: { id },
    });
    if (!existing)
      throw new NotFoundException(`Request template not found: ${id}`);

    await this.prisma.requestTemplate.update({
      where: { id },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return this.findOne(id, false);
  }
}
