import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import { ActivityAction, Prisma } from '@prisma/client';
import { assertAssignmentStatusTransition } from '../../common/assignment-status-transitions';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  notifyRequesterReadyForReview,
  notifyRequesterWorkCompleted,
} from '../notifications/workflow-notifications';
import type { UpdateAssignmentStatusDto } from './dto/update-assignment.dto';
import { invalidateWorkspaceForAssignment } from './assignment-workspace-cache';
import { AssignmentsQueryService } from './assignments-query.service';

@Injectable()
export class AssignmentsStatusMutationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: AssignmentsQueryService,
    private readonly access: AccessPolicyService,
    private readonly cache: CacheService,
  ) {}

  async updateStatus(
    id: string,
    dto: UpdateAssignmentStatusDto,
    user: RequestUser,
  ) {
    const accessCtx = await this.access.loadAssignmentAccessContext(id);
    this.access.assertCanChangeAssignmentStatus(user, accessCtx, dto.status);
    if (dto.status === 'READY_FOR_REVIEW') {
      this.access.assertCanMarkAssignmentReadyForReview(user, accessCtx);
    }
    if (dto.status === 'COMPLETED') {
      this.access.assertCanCompleteAssignment(user, accessCtx);
    }

    const existing = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        request: true,
        members: { select: { userId: true } },
      },
    });
    if (!existing) throw new NotFoundException('Assignment not found');

    assertAssignmentStatusTransition(existing.status, dto.status);

    const data: Prisma.AssignmentUpdateInput = { status: dto.status };
    if (dto.status === 'READY_FOR_REVIEW') data.readyForReviewAt = new Date();
    if (dto.status === 'COMPLETED') data.completedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const assignmentUpdated = await tx.assignment.updateMany({
        where: { id, status: existing.status },
        data,
      });
      if (assignmentUpdated.count !== 1) {
        throw new ConflictException(
          'This assignment was updated by someone else. Please refresh and try again.',
        );
      }

      const requestStatus =
        dto.status === 'READY_FOR_REVIEW'
          ? 'READY_FOR_REVIEW'
          : dto.status === 'COMPLETED'
            ? 'COMPLETED'
            : dto.status === 'IN_PROGRESS'
              ? 'IN_PROGRESS'
              : undefined;
      if (requestStatus) {
        const requestUpdated = await tx.request.updateMany({
          where: { id: existing.requestId, status: existing.request.status },
          data: {
            status: requestStatus,
            currentStage:
              dto.status === 'READY_FOR_REVIEW'
                ? 'Ready for requester review'
                : dto.status === 'COMPLETED'
                  ? 'Work completed'
                  : 'In progress',
            progressPercentage:
              dto.status === 'COMPLETED' ? 100 : existing.progressPercentage,
            ...(dto.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
          },
        });
        if (requestUpdated.count !== 1) {
          throw new ConflictException(
            'This assignment was updated by someone else. Please refresh and try again.',
          );
        }
      }
      await tx.activityLog.create({
        data: {
          requestId: existing.requestId,
          assignmentId: id,
          userId: user.id,
          action: ActivityAction.REQUEST_PROGRESS_UPDATED,
          description:
            dto.note ?? `Assignment status updated to ${dto.status}.`,
        },
      });
    });

    if (dto.status === 'READY_FOR_REVIEW') {
      await notifyRequesterReadyForReview(
        this.notifications,
        this.prisma,
        existing.request,
        id,
      );
    } else if (dto.status === 'COMPLETED') {
      await notifyRequesterWorkCompleted(
        this.notifications,
        this.prisma,
        existing.request,
        id,
      );
    }

    await invalidateWorkspaceForAssignment(this.cache, this.prisma, {
      requesterId: existing.request.createdByUserId,
      memberUserIds: existing.members.map((m) => m.userId),
      departmentId: existing.departmentId,
      actorId: user.id,
    });
    await invalidateAdminStatsCache(this.cache);

    return this.query.findOne(id, user);
  }
}
