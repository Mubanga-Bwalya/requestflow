import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import { isManagerRole } from '../../common/auth-helpers';
import { ActivityAction, NotificationType, Prisma } from '@prisma/client';
import { assertAssignmentStatusTransition } from '../../common/assignment-status-transitions';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  notifyRequesterReadyForReview,
  notifyRequesterWorkCompleted,
} from '../notifications/workflow-notifications';
import type { CreateAssignmentDto } from './dto/create-assignment.dto';
import type { UpdateAssignmentStatusDto } from './dto/update-assignment.dto';
import { invalidateWorkspaceForAssignment } from './assignment-workspace-cache';
import { AssignmentsQueryService } from './assignments-query.service';

@Injectable()
export class AssignmentsMutationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: AssignmentsQueryService,
    private readonly access: AccessPolicyService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateAssignmentDto, actor: RequestUser) {
    const assignedByUserId = actor.id;
    if (!dto.memberUserIds?.length) {
      throw new BadRequestException('At least one team member is required.');
    }

    const request = await this.prisma.request.findUnique({
      where: { id: dto.requestId },
      include: { targetDepartment: true, assignment: true },
    });
    if (!request)
      throw new NotFoundException(`Request not found: ${dto.requestId}`);
    if (request.assignment) {
      throw new ConflictException('This request already has an assignment.');
    }
    if (!['SUBMITTED', 'ACCEPTED'].includes(request.status)) {
      throw new BadRequestException(
        'Request must be submitted or accepted before assigning.',
      );
    }

    const assigner = await this.prisma.user.findUnique({
      where: { id: assignedByUserId },
      include: { role: { select: { name: true } } },
    });
    if (!assigner) throw new BadRequestException('Invalid assigner.');
    if (!isManagerRole(assigner.role?.name)) {
      throw new ForbiddenException('Only managers can create assignments.');
    }
    if (assigner.departmentId !== request.targetDepartmentId) {
      throw new ForbiddenException(
        'You can only assign work for your own department.',
      );
    }

    const members = await this.prisma.user.findMany({
      where: { id: { in: dto.memberUserIds }, isActive: true },
    });
    if (members.length !== dto.memberUserIds.length) {
      throw new BadRequestException('One or more member users not found.');
    }

    const deadline = request.deadline;
    const title = `${request.title} — assignment`;

    let assignment;
    try {
      assignment = await this.prisma.$transaction(async (tx) => {
        const fresh = await tx.request.findUnique({
          where: { id: request.id },
          select: { id: true, status: true, assignment: { select: { id: true } } },
        });
        if (!fresh) throw new NotFoundException(`Request not found: ${dto.requestId}`);
        if (fresh.assignment) {
          throw new ConflictException('This request already has an assignment.');
        }
        if (!['SUBMITTED', 'ACCEPTED'].includes(fresh.status)) {
          throw new BadRequestException(
            'Request must be submitted or accepted before assigning.',
          );
        }

        const created = await tx.assignment.create({
          data: {
            requestId: request.id,
            title,
            description: dto.description?.trim() || null,
            assignedByUserId,
            departmentId: request.targetDepartmentId,
            status: 'ASSIGNED',
            progressPercentage: 0,
            deadline,
          },
        });

        for (const userId of dto.memberUserIds) {
          await tx.assignmentMember.create({
            data: {
              assignmentId: created.id,
              userId,
              isManagerMember: userId === assignedByUserId,
            },
          });
        }

        await tx.request.update({
          where: { id: request.id, status: fresh.status },
          data: {
            status: 'ASSIGNED',
            currentStage: 'Assigned to team',
          },
        });

        await tx.activityLog.create({
          data: {
            requestId: request.id,
            assignmentId: created.id,
            userId: assignedByUserId,
            action: ActivityAction.ASSIGNMENT_CREATED,
            description: `Assignment created for request ${request.requestNumber}.`,
          },
        });

        return created;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('This request already has an assignment.');
      }
      throw err;
    }

    await this.notifications.createMany(
      dto.memberUserIds.map((userId) => ({
        userId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'New assignment',
        message: `You were assigned to work on ${request.requestNumber}: ${title}.`,
        relatedRequestId: request.id,
        relatedAssignmentId: assignment.id,
      })),
    );

    await this.notifications.create({
      userId: request.createdByUserId,
      type: NotificationType.REQUEST_ASSIGNED,
      title: 'Request assigned',
      message: `Your request ${request.requestNumber} has been assigned to the team.`,
      relatedRequestId: request.id,
      relatedAssignmentId: assignment.id,
    });

    await this.cache.del(CacheKeys.workspaceSummary(request.createdByUserId));
    await Promise.all(
      dto.memberUserIds.map((id) =>
        this.cache.del(CacheKeys.workspaceSummary(id)),
      ),
    );
    await invalidateAdminStatsCache(this.cache);

    return this.query.findOne(assignment.id, actor);
  }

  async updateStatus(
    id: string,
    dto: UpdateAssignmentStatusDto,
    user: RequestUser,
  ) {
    const accessCtx = await this.access.loadAssignmentAccessContext(id);
    this.access.assertCanMutateAssignment(user, accessCtx);

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
