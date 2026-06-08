import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus, SystemEventLevel } from '@prisma/client';
import { parsePagination } from '../../common/pagination';
import { SystemEventsService } from '../../common/system-events/system-events.service';
import { PrismaService } from '../../prisma/prisma.service';

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

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemEvents: SystemEventsService,
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

  private async buildStats(departmentName?: string) {
    const baseWhere = this.requestWhere(departmentName);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalDepartments,
      activeTemplates,
      activeRequests,
      completedRequests,
      overdueRequests,
      statusGroups,
    ] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.requestTemplate.count({ where: { isActive: true } }),
      this.prisma.request.count({
        where: { ...baseWhere, status: { in: ACTIVE_STATUSES } },
      }),
      this.prisma.request.count({
        where: { ...baseWhere, status: { in: ['COMPLETED', 'APPROVED'] } },
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
    ]);

    const byStatus = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count._all]),
    ) as Record<string, number>;

    const inProgress =
      (byStatus['IN_PROGRESS'] ?? 0) + (byStatus['ASSIGNED'] ?? 0);
    const needsInfo = byStatus['NEEDS_INFORMATION'] ?? 0;

    const progressAgg = await this.prisma.request.aggregate({
      where: baseWhere,
      _avg: { progressPercentage: true },
      _count: { _all: true },
    });
    const avgProgress =
      progressAgg._count._all > 0 && progressAgg._avg.progressPercentage != null
        ? Math.round(progressAgg._avg.progressPercentage)
        : 0;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const completedThisMonth = await this.prisma.request.count({
      where: {
        ...baseWhere,
        status: { in: ['COMPLETED', 'APPROVED'] },
        completedAt: { gte: monthStart },
      },
    });

    let deptBreakdown = '';
    if (!departmentName || departmentName === 'ALL') {
      const [depts, deptCounts] = await Promise.all([
        this.prisma.department.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        this.prisma.request.groupBy({
          by: ['targetDepartmentId'],
          _count: { _all: true },
        }),
      ]);
      const countByDeptId = new Map(
        deptCounts.map((g) => [g.targetDepartmentId, g._count._all]),
      );
      const counts = depts.map((d) => countByDeptId.get(d.id) ?? 0);
      const total = counts.reduce((a, b) => a + b, 0) || 1;
      deptBreakdown = depts
        .map((d, i) => `${d.name} ${Math.round((counts[i] / total) * 100)}%`)
        .join(' | ');
    }

    return {
      summary: [
        { label: 'Total Users', value: String(totalUsers) },
        { label: 'Departments', value: String(totalDepartments) },
        { label: 'Active Requests', value: String(activeRequests) },
        { label: 'Completed Requests', value: String(completedRequests) },
        { label: 'Overdue Requests', value: String(overdueRequests) },
        { label: 'Templates Configured', value: String(activeTemplates) },
      ],
      reports: [
        {
          label: 'Requests by Department',
          value:
            departmentName && departmentName !== 'ALL'
              ? `${departmentName} 100%`
              : deptBreakdown || '—',
        },
        {
          label: 'Requests by Status',
          value: `In Progress ${inProgress} | Needs Info ${needsInfo}`,
        },
        { label: 'Average Progress', value: `${avgProgress}%` },
        { label: 'Completed This Month', value: String(completedThisMonth) },
        { label: 'Overdue Requests', value: String(overdueRequests) },
      ],
    };
  }

  async getDashboard(activityLimit?: number) {
    const stats = await this.buildStats();
    if (!activityLimit) return stats;
    const activity = await this.getActivity(activityLimit);
    return { ...stats, activity };
  }

  async getReports(departmentName?: string) {
    const dept =
      departmentName && departmentName !== 'ALL' ? departmentName : undefined;
    const stats = await this.buildStats(dept);
    return { cards: stats.reports };
  }

  async getSystemEvents(
    pageRaw?: string,
    limitRaw?: string,
    levelRaw?: string,
  ) {
    const pagination = parsePagination(pageRaw, limitRaw);
    const level =
      levelRaw === 'ERROR' || levelRaw === 'WARN'
        ? (levelRaw as SystemEventLevel)
        : undefined;
    return this.systemEvents.listPaginated(pagination, level);
  }

  async getActivity(limit = 10) {
    const rows = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
      include: {
        request: { select: { requestNumber: true } },
        user: { select: { fullName: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      requestNumber: r.request?.requestNumber ?? null,
      userName: r.user?.fullName ?? null,
    }));
  }
}
