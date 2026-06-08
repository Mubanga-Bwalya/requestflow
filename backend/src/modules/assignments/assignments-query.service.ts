import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import {
  assignmentStatusesForTab,
  parseListTab,
} from '../../common/list-tab-filters';
import { paginatedResult, resolveListPagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ASSIGNMENT_LIST_INCLUDE,
  ASSIGNMENT_LIST_SUMMARY_INCLUDE,
  mapAssignmentDetail,
  mapAssignmentListItem,
} from './assignment.mapper';

@Injectable()
export class AssignmentsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessPolicyService,
  ) {}

  async findAllForUser(
    userId: string,
    query: { tab?: string; q?: string; page?: number; limit?: number } = {},
  ) {
    const where: Prisma.AssignmentWhereInput = {
      members: { some: { userId } },
    };

    const tab = parseListTab(query.tab);
    if (tab) {
      const statuses = assignmentStatusesForTab(tab);
      if (statuses?.length) where.status = { in: statuses };
    }

    const search = query.q?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        {
          request: { requestNumber: { contains: search, mode: 'insensitive' } },
        },
      ];
    }

    const pagination = resolveListPagination(query.page, query.limit);
    const [total, rows] = await Promise.all([
      this.prisma.assignment.count({ where }),
      this.prisma.assignment.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: ASSIGNMENT_LIST_SUMMARY_INCLUDE,
      }),
    ]);
    return paginatedResult(
      rows.map((r) => mapAssignmentListItem(r)),
      total,
      pagination,
    );
  }

  async countForUser(userId: string) {
    return this.prisma.assignment.count({
      where: { members: { some: { userId } } },
    });
  }

  async countToStartForUser(userId: string) {
    return this.prisma.assignment.count({
      where: { members: { some: { userId } }, status: 'ASSIGNED' },
    });
  }

  async findOne(id: string, user: RequestUser) {
    const accessCtx = await this.access.loadAssignmentAccessContext(id);
    this.access.assertCanViewAssignment(user, accessCtx);

    const row = await this.prisma.assignment.findUnique({
      where: { id },
      include: ASSIGNMENT_LIST_INCLUDE,
    });
    if (!row) throw new NotFoundException('Assignment not found');
    return mapAssignmentDetail(row);
  }
}
