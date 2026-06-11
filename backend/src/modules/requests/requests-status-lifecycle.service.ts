import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, Prisma, RequestStatus } from '@prisma/client';
import { notifyAfterRequestStatusChange } from './requests-lifecycle-notifications';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import { assertAssignmentStatusTransition } from '../../common/assignment-status-transitions';
import { assertRequestStatusTransition } from '../../common/request-status-transitions';
import { assertRequestStatusAlignedWithAssignment } from '../../common/request-workflow-guards';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { invalidateAfterRequestLifecycle } from './requests-lifecycle-cache';
import { RequestsQueryService } from './requests-query.service';

@Injectable()
export class RequestsStatusLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: RequestsQueryService,
    private readonly access: AccessPolicyService,
    private readonly cache: CacheService,
  ) {}

  async updateStatus(
    id: string,
    dto: UpdateRequestStatusDto,
    user: RequestUser,
  ) {
    const accessCtx = await this.access.loadRequestAccessContext(id);
    this.access.assertCanChangeRequestStatus(user, accessCtx, dto.status);

    const existing = await this.prisma.request.findUnique({
      where: { id },
      include: {
        assignment: {
          select: { id: true, status: true, progressPercentage: true },
        },
      },
    });
    if (!existing) throw new NotFoundException('Request not found');

    if (dto.status === 'COMPLETED' || dto.status === 'READY_FOR_REVIEW') {
      assertRequestStatusAlignedWithAssignment(
        dto.status,
        existing.assignment
          ? {
              status: existing.assignment.status,
              progressPercentage: existing.assignment.progressPercentage,
            }
          : null,
      );
    }

    if (dto.status === 'APPROVED' || dto.status === 'REOPENED') {
      if (!['COMPLETED', 'READY_FOR_REVIEW'].includes(existing.status)) {
        throw new BadRequestException(
          'Request is not ready for requester review.',
        );
      }
    }

    assertRequestStatusTransition(existing.status, dto.status);

    const data: Prisma.RequestUpdateInput = { status: dto.status };
    if (dto.status === 'APPROVED') data.approvedAt = new Date();
    if (dto.status === 'REJECTED') data.rejectedAt = new Date();
    if (dto.status === 'COMPLETED') data.completedAt = new Date();
    if (dto.status === 'REOPENED') data.currentStage = 'Reopened by requester';
    if (dto.status === 'APPROVED') data.currentStage = 'Approved by requester';

    const actionMap: Partial<Record<RequestStatus, ActivityAction>> = {
      APPROVED: ActivityAction.REQUEST_APPROVED,
      REOPENED: ActivityAction.REQUEST_REOPENED,
      REJECTED: ActivityAction.REQUEST_REJECTED,
    };

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.request.updateMany({
        where: { id, status: existing.status },
        data,
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'This request was updated by someone else. Refresh and try again.',
        );
      }
      if (dto.status === 'REOPENED' && existing.assignment) {
        assertAssignmentStatusTransition(
          existing.assignment.status,
          'REOPENED',
        );
        const assignmentUpdated = await tx.assignment.updateMany({
          where: {
            id: existing.assignment.id,
            status: existing.assignment.status,
          },
          data: { status: 'REOPENED' },
        });
        if (assignmentUpdated.count !== 1) {
          throw new ConflictException(
            'This request was updated by someone else. Refresh and try again.',
          );
        }
      }

      await tx.activityLog.create({
        data: {
          requestId: id,
          userId: user.id,
          action:
            actionMap[dto.status] ?? ActivityAction.REQUEST_PROGRESS_UPDATED,
          description: dto.note ?? `Request status updated to ${dto.status}.`,
          oldValue: { status: existing.status },
          newValue: { status: dto.status },
        },
      });
    });

    await notifyAfterRequestStatusChange(
      this.notifications,
      this.prisma,
      existing,
      dto.status,
      user.id,
    );

    await invalidateAfterRequestLifecycle(
      this.cache,
      existing.createdByUserId,
      user.id,
    );

    return this.query.findOne(id, user);
  }
}
