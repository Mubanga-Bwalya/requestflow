import { Injectable } from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Records a system-wide audit entry (no request required). */
  async record(params: {
    description: string;
    userId?: string;
    action?: ActivityAction;
    requestId?: string;
    assignmentId?: string;
  }): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          description: params.description.slice(0, 2000),
          userId: params.userId ?? null,
          requestId: params.requestId ?? null,
          assignmentId: params.assignmentId ?? null,
          action: params.action ?? ActivityAction.REQUEST_PROGRESS_UPDATED,
        },
      });
    } catch {
      /* audit must not break primary flows */
    }
  }
}
