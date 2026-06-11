import { Injectable, Logger } from '@nestjs/common';
import { Prisma, SystemEventLevel } from '@prisma/client';
import {
  paginatedResult,
  parsePagination,
  type PaginationParams,
} from '../pagination';
import { PrismaService } from '../../prisma/prisma.service';

export type RecordSystemEventInput = {
  level: SystemEventLevel;
  code: string;
  message: string;
  httpMethod?: string;
  path?: string;
  statusCode?: number;
  userId?: string;
  requestId?: string;
  context?: Record<string, unknown>;
};

@Injectable()
export class SystemEventsService {
  private readonly logger = new Logger(SystemEventsService.name);
  private readonly onceKeys = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  /** Persists at most one event per key per process (infra warnings, etc.). */
  async recordOnce(key: string, input: RecordSystemEventInput): Promise<void> {
    if (this.onceKeys.has(key)) return;
    this.onceKeys.add(key);
    await this.record(input);
  }

  /** Skips recording when the same code was logged recently (survives API restarts). */
  async recordIfNotRecent(
    input: RecordSystemEventInput,
    withinMs = 86_400_000,
  ): Promise<void> {
    try {
      const since = new Date(Date.now() - withinMs);
      const exists = await this.prisma.systemEvent.findFirst({
        where: { code: input.code, createdAt: { gte: since } },
        select: { id: true },
      });
      if (exists) return;
    } catch {
      /* proceed if lookup fails */
    }
    await this.record(input);
  }

  /** Persists operational events for the admin dashboard; never throws to callers. */
  async record(input: RecordSystemEventInput): Promise<void> {
    const line = `[${input.code}] ${input.message} ${input.path ?? ''} (${input.requestId ?? 'no-id'})`;
    if (input.level === 'ERROR') {
      this.logger.error(line);
    } else {
      this.logger.warn(line);
    }

    try {
      await this.prisma.systemEvent.create({
        data: {
          level: input.level,
          code: input.code,
          message: input.message.slice(0, 2000),
          httpMethod: input.httpMethod?.slice(0, 16) ?? null,
          path: input.path?.slice(0, 500) ?? null,
          statusCode: input.statusCode ?? null,
          userId: input.userId ?? null,
          requestId: input.requestId?.slice(0, 64) ?? null,
          context:
            input.context === undefined
              ? Prisma.JsonNull
              : (input.context as Prisma.InputJsonValue),
        },
      });
    } catch (err) {
      this.logger.warn(
        `Could not persist system event (run database/008_system_events.sql): ${String(err)}`,
      );
    }
  }

  private mapRow(
    r: Prisma.SystemEventGetPayload<{
      include: { user: { select: { fullName: true; email: true } } };
    }>,
  ) {
    return {
      id: r.id,
      level: r.level,
      code: r.code,
      message: r.message,
      httpMethod: r.httpMethod,
      path: r.path,
      statusCode: r.statusCode,
      requestId: r.requestId,
      userName: r.user?.fullName ?? null,
      userEmail: r.user?.email ?? null,
      createdAt: r.createdAt.toISOString(),
      context: r.context,
    };
  }

  async listPaginated(pagination: PaginationParams, level?: SystemEventLevel) {
    const where = level === 'ERROR' || level === 'WARN' ? { level } : undefined;
    const [total, rows] = await Promise.all([
      this.prisma.systemEvent.count({ where }),
      this.prisma.systemEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
        include: { user: { select: { fullName: true, email: true } } },
      }),
    ]);
    return paginatedResult(
      rows.map((r) => this.mapRow(r)),
      total,
      pagination,
    );
  }

  async listRecent(limit = 20) {
    const pagination = parsePagination('1', String(limit));
    const result = await this.listPaginated(pagination);
    return result.items;
  }
}
