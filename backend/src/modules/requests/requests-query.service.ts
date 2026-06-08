import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import {
  parseListTab,
  requestStatusesForTab,
} from '../../common/list-tab-filters';
import { paginatedResult, resolveListPagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  mapRequestListItem,
  REQUEST_LIST_INCLUDE,
  REQUEST_LIST_INCLUDE_LIGHT,
  requestActionNeeded,
} from './request.mapper';

@Injectable()
export class RequestsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessPolicyService,
  ) {}

  async findAll(query: {
    createdByUserId?: string;
    targetDepartmentName?: string;
    tab?: string;
    q?: string;
    page?: number;
    limit?: number;
  }) {
    const where: Prisma.RequestWhereInput = {};
    if (query.createdByUserId) where.createdByUserId = query.createdByUserId;
    if (query.targetDepartmentName) {
      where.targetDepartment = {
        name: { equals: query.targetDepartmentName, mode: 'insensitive' },
      };
    }

    const tab = parseListTab(query.tab);
    if (tab) {
      const scope = query.targetDepartmentName ? 'inbox' : 'mine';
      const statuses = requestStatusesForTab(tab, scope);
      if (statuses?.length) where.status = { in: statuses };
    }

    const search = query.q?.trim();
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { template: { name: { contains: search, mode: 'insensitive' } } },
        {
          createdByUser: {
            fullName: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const pagination = resolveListPagination(query.page, query.limit);
    const include = query.targetDepartmentName
      ? REQUEST_LIST_INCLUDE
      : REQUEST_LIST_INCLUDE_LIGHT;
    const [total, rows] = await Promise.all([
      this.prisma.request.count({ where }),
      this.prisma.request.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include,
      }),
    ]);
    return paginatedResult(
      rows.map((r) => mapRequestListItem(r)),
      total,
      pagination,
    );
  }

  async findOne(id: string, user: RequestUser) {
    const accessCtx = await this.access.loadRequestAccessContext(id);
    this.access.assertCanViewRequest(user, accessCtx);

    const row = await this.prisma.request.findUnique({
      where: { id },
      include: {
        targetDepartment: { select: { name: true } },
        sourceDepartment: { select: { name: true } },
        template: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, fullName: true, email: true } },
        fieldAnswers: {
          include: {
            templateField: {
              select: { fieldKey: true, label: true, fieldType: true },
            },
          },
        },
        missingInfoRequests: {
          where: { status: 'OPEN' },
          include: {
            items: {
              include: {
                templateField: { select: { fieldKey: true, label: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignment: { select: { progressPercentage: true } },
        activityLogs: { orderBy: { createdAt: 'asc' }, take: 100 },
      },
    });

    if (!row) throw new NotFoundException('Request not found');

    const openMissing = row.missingInfoRequests[0];
    const missingFields =
      openMissing?.items.map((i) => ({
        fieldKey: i.templateField?.fieldKey ?? null,
        label: i.templateField?.label ?? i.reasonLabel,
      })) ?? [];

    return {
      id: row.id,
      requestNumber: row.requestNumber,
      title: row.title,
      description: row.description,
      department: row.targetDepartment.name,
      sourceDepartment: row.sourceDepartment.name,
      requestType: row.template.name,
      templateId: row.template.id,
      status: row.status,
      priority: row.priority,
      progress: row.assignment?.progressPercentage ?? row.progressPercentage,
      deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : null,
      currentStage: row.currentStage,
      actionNeeded: requestActionNeeded(row.status, missingFields.length > 0),
      createdBy: row.createdByUser,
      fieldAnswers: row.fieldAnswers.map((a) => ({
        fieldKey: a.templateField.fieldKey,
        label: a.templateField.label,
        fieldType: a.templateField.fieldType,
        answerText: a.answerText,
        answerJson: a.answerJson,
        fileUrl: a.fileUrl,
      })),
      missingInformation: missingFields,
      openMissingRequestId: openMissing?.id ?? null,
      activity: row.activityLogs.map((l) => l.description),
    };
  }
}
