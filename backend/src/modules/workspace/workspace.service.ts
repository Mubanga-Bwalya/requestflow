import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestsService } from '../requests/requests.service';
import { PrismaService } from '../../prisma/prisma.service';

const PREVIEW_LIMIT = 10;

type WorkspacePayload = {
  stats: {
    myRequestsTotal: number;
    needsResponse: number;
    tasksToStart: number;
    inboxActions: number;
  };
  requests: unknown[];
  assignments: unknown[];
  inbox: unknown[];
  unreadNotificationCount: number;
};

function listItems<T>(result: T[] | { items: T[] }): T[] {
  return Array.isArray(result) ? result : result.items;
}

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requests: RequestsService,
    private readonly assignments: AssignmentsService,
    private readonly notifications: NotificationsService,
    private readonly cache: CacheService,
  ) {}

  private async inboxActionCount(departmentName: string) {
    return this.prisma.request.count({
      where: {
        targetDepartment: {
          name: { equals: departmentName, mode: Prisma.QueryMode.insensitive },
        },
        OR: [
          { status: 'SUBMITTED' },
          { status: 'ACCEPTED', assignment: { is: null } },
        ],
      },
    });
  }

  async getForUser(params: {
    userId: string;
    departmentName?: string;
    includeInbox?: boolean;
  }) {
    const { userId, departmentName, includeInbox } = params;

    const cacheKey = CacheKeys.workspaceSummary(userId);
    const cached = await this.cache.getJson<WorkspacePayload>(cacheKey);
    if (cached) return cached;

    const [
      myRequestsTotal,
      needsResponse,
      tasksToStart,
      inboxActions,
      requestsResult,
      assignmentsResult,
      inboxResult,
      unreadNotificationCount,
    ] = await Promise.all([
      this.prisma.request.count({ where: { createdByUserId: userId } }),
      this.prisma.request.count({
        where: {
          createdByUserId: userId,
          status: {
            in: ['NEEDS_INFORMATION', 'READY_FOR_REVIEW', 'COMPLETED'],
          },
        },
      }),
      this.assignments.countToStartForUser(userId),
      includeInbox && departmentName
        ? this.inboxActionCount(departmentName)
        : Promise.resolve(0),
      this.requests.findAll({
        createdByUserId: userId,
        page: 1,
        limit: PREVIEW_LIMIT,
      }),
      this.assignments.findAllForUser(userId, {
        page: 1,
        limit: PREVIEW_LIMIT,
      }),
      includeInbox && departmentName
        ? this.requests.findAll({
            targetDepartmentName: departmentName,
            page: 1,
            limit: PREVIEW_LIMIT,
          })
        : Promise.resolve([]),
      this.notifications.countUnread(userId),
    ]);

    const payload = {
      stats: {
        myRequestsTotal,
        needsResponse,
        tasksToStart,
        inboxActions,
      },
      requests: listItems(requestsResult),
      assignments: listItems(assignmentsResult),
      inbox: listItems(inboxResult),
      unreadNotificationCount,
    };

    await this.cache.setJson(cacheKey, payload, CacheTtl.workspaceSummarySeconds);
    return payload;
  }
}
