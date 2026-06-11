import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { buildReportInsights } from './admin-reports-insights';
import type {
  AdminReportsPayload,
  ReportBreakdownItem,
} from './admin-reports.types';

const TERMINAL_STATUSES: RequestStatus[] = [
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
];

const ACTIVE_STATUSES: RequestStatus[] = [
  'SUBMITTED',
  'NEEDS_INFORMATION',
  'ACCEPTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_REVIEW',
  'REOPENED',
];

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Waiting for manager',
  ACCEPTED: 'Accepted — assign team',
  ASSIGNED: 'Assigned to team',
  IN_PROGRESS: 'In progress',
  NEEDS_INFORMATION: 'Needs information',
  READY_FOR_REVIEW: 'Ready for approval',
  COMPLETED: 'Work completed',
  APPROVED: 'Approved',
  REOPENED: 'Sent back',
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private requestWhere(departmentName?: string): Prisma.RequestWhereInput {
    const where: Prisma.RequestWhereInput = {};
    if (departmentName && departmentName !== 'ALL') {
      where.targetDepartment = {
        name: { equals: departmentName, mode: 'insensitive' },
      };
    }
    return where;
  }

  private toBreakdown(
    rows: { key: string; label: string; count: number }[],
    total: number,
  ): ReportBreakdownItem[] {
    const denom = total || 1;
    return rows
      .filter((r) => r.count > 0)
      .map((r) => ({
        key: r.key,
        label: r.label,
        count: r.count,
        percent: Math.round((r.count / denom) * 100),
      }));
  }

  async buildReports(departmentName?: string): Promise<AdminReportsPayload> {
    const filter =
      departmentName && departmentName !== 'ALL' ? departmentName : null;
    const baseWhere = this.requestWhere(departmentName);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );

    const [
      totalRequests,
      activeRequests,
      overdue,
      statusGroups,
      priorityGroups,
      progressAgg,
      completedThisMonth,
      completedLastMonth,
      submittedThisMonth,
      deptRows,
    ] = await Promise.all([
      this.prisma.request.count({ where: baseWhere }),
      this.prisma.request.count({
        where: { ...baseWhere, status: { in: ACTIVE_STATUSES } },
      }),
      this.prisma.request.count({
        where: {
          ...baseWhere,
          deadline: { lt: today },
          status: { notIn: TERMINAL_STATUSES },
        },
      }),
      this.prisma.request.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.request.groupBy({
        by: ['priority'],
        where: baseWhere,
        _count: { _all: true },
      }),
      this.prisma.request.aggregate({
        where: { ...baseWhere, status: { in: ACTIVE_STATUSES } },
        _avg: { progressPercentage: true },
        _count: { _all: true },
      }),
      this.prisma.request.count({
        where: {
          ...baseWhere,
          status: { in: ['COMPLETED', 'APPROVED'] },
          completedAt: { gte: monthStart },
        },
      }),
      this.prisma.request.count({
        where: {
          ...baseWhere,
          status: { in: ['COMPLETED', 'APPROVED'] },
          completedAt: { gte: lastMonthStart, lt: monthStart },
        },
      }),
      this.prisma.request.count({
        where: { ...baseWhere, submittedAt: { gte: monthStart } },
      }),
      filter
        ? Promise.resolve(null)
        : this.prisma.request.groupBy({
            by: ['targetDepartmentId'],
            _count: { _all: true },
          }),
    ]);

    const byStatus = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    ) as Record<string, number>;

    const avgProgress =
      progressAgg._count._all > 0 && progressAgg._avg.progressPercentage != null
        ? Math.round(progressAgg._avg.progressPercentage)
        : 0;

    const statusBreakdown = this.toBreakdown(
      statusGroups.map((g) => ({
        key: g.status,
        label: STATUS_LABELS[g.status] ?? g.status,
        count: g._count._all,
      })),
      totalRequests,
    );

    const priorityBreakdown = this.toBreakdown(
      priorityGroups.map((g) => ({
        key: g.priority,
        label: PRIORITY_LABELS[g.priority] ?? g.priority,
        count: g._count._all,
      })),
      totalRequests,
    );

    let departmentBreakdown: ReportBreakdownItem[] = [];
    if (filter) {
      departmentBreakdown = [
        {
          key: filter,
          label: filter,
          count: totalRequests,
          percent: totalRequests > 0 ? 100 : 0,
        },
      ];
    } else if (deptRows) {
      const depts = await this.prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      const countById = new Map(
        deptRows.map((r) => [r.targetDepartmentId, r._count._all]),
      );
      departmentBreakdown = this.toBreakdown(
        depts.map((d) => ({
          key: d.name,
          label: d.name,
          count: countById.get(d.id) ?? 0,
        })),
        totalRequests,
      );
    }

    const kpis = {
      totalRequests,
      activeRequests,
      completedThisMonth,
      completedLastMonth,
      overdue,
      avgProgress,
      awaitingAcceptance: byStatus['SUBMITTED'] ?? 0,
      needsInformation: byStatus['NEEDS_INFORMATION'] ?? 0,
      readyForReview: byStatus['READY_FOR_REVIEW'] ?? 0,
      submittedThisMonth,
    };

    return {
      departmentFilter: filter,
      kpis,
      statusBreakdown,
      departmentBreakdown,
      priorityBreakdown,
      insights: buildReportInsights(kpis, filter),
    };
  }

  async getReports(departmentName?: string): Promise<AdminReportsPayload> {
    const deptKey =
      departmentName && departmentName !== 'ALL' ? departmentName : 'ALL';
    const cacheKey = `${CacheKeys.adminReports(deptKey)}:v2`;
    const cached = await this.cache.getJson<AdminReportsPayload>(cacheKey);
    if (cached) return cached;

    const payload = await this.buildReports(departmentName);
    await this.cache.setJson(cacheKey, payload, CacheTtl.adminSummarySeconds);
    return payload;
  }
}
