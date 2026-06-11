import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { paginatedResult, parsePagination } from '../../common/pagination';
import { SystemEventsService } from '../../common/system-events/system-events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminReportsService } from './admin-reports.service';
import { FrontendDiagnosticsService } from '../../common/diagnostics/frontend-diagnostics.service';
import type { ClientEventDto } from '../../common/diagnostics/client-event.dto';

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

type StatsPayload = {
  summary: { label: string; value: string }[];
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemEvents: SystemEventsService,
    private readonly cache: CacheService,
    private readonly reports: AdminReportsService,
    private readonly diagnostics: FrontendDiagnosticsService,
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

  private async buildStats(departmentName?: string): Promise<StatsPayload> {
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
    ]);

    return {
      summary: [
        { label: 'Total Users', value: String(totalUsers) },
        { label: 'Departments', value: String(totalDepartments) },
        { label: 'Active Requests', value: String(activeRequests) },
        { label: 'Completed Requests', value: String(completedRequests) },
        { label: 'Overdue Requests', value: String(overdueRequests) },
        { label: 'Templates Configured', value: String(activeTemplates) },
      ],
    };
  }

  private async getCachedDashboardStats(): Promise<StatsPayload> {
    const cacheKey = CacheKeys.adminDashboardSummary;
    const cached = await this.cache.getJson<StatsPayload>(cacheKey);
    if (cached) return cached;

    const stats = await this.buildStats();
    await this.cache.setJson(cacheKey, stats, CacheTtl.adminSummarySeconds);
    return stats;
  }

  async getDashboard(activityLimit?: number) {
    const stats = await this.getCachedDashboardStats();
    if (!activityLimit) return { summary: stats.summary };
    const activity = await this.getActivity(activityLimit);
    return { summary: stats.summary, activity };
  }

  getReports(departmentName?: string) {
    return this.reports.getReports(departmentName);
  }

  recordClientEvent(actorId: string, dto: ClientEventDto) {
    return this.diagnostics.record(dto, actorId);
  }

  async getSystemEvents(
    pageRaw?: string,
    limitRaw?: string,
    levelRaw?: string,
  ) {
    const pagination = parsePagination(pageRaw, limitRaw);
    const level =
      levelRaw === 'ERROR' || levelRaw === 'WARN' ? levelRaw : undefined;
    return this.systemEvents.listPaginated(pagination, level);
  }

  private mapActivityRow(
    r: Prisma.ActivityLogGetPayload<{
      include: {
        request: { select: { requestNumber: true } };
        user: { select: { fullName: true; email: true } };
      };
    }>,
  ) {
    return {
      id: r.id,
      action: r.action,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      requestNumber: r.request?.requestNumber ?? null,
      userName: r.user?.fullName ?? null,
      userEmail: r.user?.email ?? null,
    };
  }

  async getActivity(limit = 10) {
    const rows = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 50),
      include: {
        request: { select: { requestNumber: true } },
        user: { select: { fullName: true, email: true } },
      },
    });
    return rows.map((r) => this.mapActivityRow(r));
  }

  async getActivityPaginated(pageRaw?: string, limitRaw?: string) {
    const pagination = parsePagination(pageRaw, limitRaw);
    const [total, rows] = await Promise.all([
      this.prisma.activityLog.count(),
      this.prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: {
          request: { select: { requestNumber: true } },
          user: { select: { fullName: true, email: true } },
        },
      }),
    ]);
    return paginatedResult(
      rows.map((r) => this.mapActivityRow(r)),
      total,
      pagination,
    );
  }
}
