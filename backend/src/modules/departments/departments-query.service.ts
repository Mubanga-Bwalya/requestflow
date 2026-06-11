import { Injectable, NotFoundException } from '@nestjs/common';
import {
  paginatedResult,
  resolveListPagination,
} from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  departmentListInclude,
  mapDepartmentRow,
  TERMINAL_REQUEST_STATUSES,
} from './departments.mapper';

@Injectable()
export class DepartmentsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async activeRequestCount(departmentId: string) {
    return this.prisma.request.count({
      where: {
        targetDepartmentId: departmentId,
        status: { notIn: TERMINAL_REQUEST_STATUSES },
      },
    });
  }

  private async activeRequestCountsByDepartment(): Promise<
    Map<string, number>
  > {
    const groups = await this.prisma.request.groupBy({
      by: ['targetDepartmentId'],
      where: { status: { notIn: TERMINAL_REQUEST_STATUSES } },
      _count: { _all: true },
    });
    return new Map(groups.map((g) => [g.targetDepartmentId, g._count._all]));
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
        include: departmentListInclude(),
      }),
    ]);
    return paginatedResult(
      rows.map((d) => mapDepartmentRow(d, activeCounts.get(d.id) ?? 0)),
      total,
      pagination,
    );
  }

  async findOne(id: string) {
    const d = await this.prisma.department.findUnique({
      where: { id },
      include: departmentListInclude(),
    });

    if (!d) {
      throw new NotFoundException(`Department not found: ${id}`);
    }

    return mapDepartmentRow(d, await this.activeRequestCount(d.id));
  }
}
