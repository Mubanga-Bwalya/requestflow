import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { CacheKeys, CacheTtl } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { paginatedResult, resolveListPagination } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.service';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRequestId?: string;
  relatedAssignmentId?: string;
  relatedMilestoneId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async invalidateUnread(userId: string) {
    await this.cache.del(CacheKeys.notificationUnread(userId));
    await this.cache.del(CacheKeys.workspaceSummary(userId));
  }

  async create(input: CreateNotificationInput) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedRequestId: input.relatedRequestId ?? null,
        relatedAssignmentId: input.relatedAssignmentId ?? null,
        relatedMilestoneId: input.relatedMilestoneId ?? null,
      },
    });
    await this.invalidateUnread(input.userId);
    return row;
  }

  async createMany(inputs: CreateNotificationInput[]) {
    if (!inputs.length) return;
    await this.prisma.notification.createMany({
      data: inputs.map((input) => ({
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedRequestId: input.relatedRequestId ?? null,
        relatedAssignmentId: input.relatedAssignmentId ?? null,
        relatedMilestoneId: input.relatedMilestoneId ?? null,
      })),
    });
    const userIds = [...new Set(inputs.map((i) => i.userId))];
    await Promise.all(userIds.map((id) => this.invalidateUnread(id)));
  }

  async countUnread(userId: string) {
    const cacheKey = CacheKeys.notificationUnread(userId);
    const cached = await this.cache.getJson<number>(cacheKey);
    if (typeof cached === 'number') return cached;

    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    await this.cache.setJson(cacheKey, count, CacheTtl.notificationUnreadSeconds);
    return count;
  }

  private mapNotification(n: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    relatedRequestId: string | null;
    relatedAssignmentId: string | null;
    type: NotificationType;
  }) {
    return {
      id: n.id,
      title: n.title,
      message: n.message,
      read: n.isRead,
      createdAt: n.createdAt.toISOString(),
      href: n.relatedRequestId
        ? `/requests/${n.relatedRequestId}`
        : n.relatedAssignmentId
          ? `/tasks/${n.relatedAssignmentId}`
          : undefined,
      type: n.type,
    };
  }

  async findAllForUser(userId: string, page?: number, limit?: number) {
    const where = { userId };

    const pagination = resolveListPagination(page, limit);
    const [total, rows] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);
    return paginatedResult(
      rows.map((n) => this.mapNotification(n)),
      total,
      pagination,
    );
  }

  async markRead(id: string, userId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException(`Notification not found: ${id}`);
    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    await this.invalidateUnread(userId);
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    await this.invalidateUnread(userId);
    return { ok: true };
  }
}
