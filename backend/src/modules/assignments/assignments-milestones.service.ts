import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, NotificationType } from '@prisma/client';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { notifyRequesterWorkCompleted } from '../notifications/workflow-notifications';
import type {
  CreateMilestoneDto,
  UpdateMilestoneDto,
} from './dto/update-assignment.dto';
import {
  mapMilestoneStatusToDb,
  recomputeAssignmentProgress,
  syncRequestProgressFromAssignment,
} from './assignment.mapper';
import { AssignmentsQueryService } from './assignments-query.service';

@Injectable()
export class AssignmentsMilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: AssignmentsQueryService,
    private readonly access: AccessPolicyService,
  ) {}

  async createMilestone(
    assignmentId: string,
    dto: CreateMilestoneDto,
    user: RequestUser,
  ) {
    const accessCtx =
      await this.access.loadAssignmentAccessContext(assignmentId);
    this.access.assertCanMutateAssignment(user, accessCtx);

    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { milestones: true, members: true, request: true },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const isMember = assignment.members.some(
      (m) => m.userId === dto.ownerUserId,
    );
    if (!isMember) {
      throw new BadRequestException(
        'Milestone owner must be an assignment member.',
      );
    }

    const status = mapMilestoneStatusToDb('TODO');
    const progress = 0;
    let deadline: Date | null = null;
    if (dto.deadline?.trim()) {
      deadline = new Date(dto.deadline);
      if (Number.isNaN(deadline.getTime())) {
        throw new BadRequestException('Invalid milestone deadline date.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.milestone.create({
        data: {
          assignmentId,
          ownerUserId: dto.ownerUserId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          status,
          progressPercentage: progress,
          deadline,
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
      });

      const allMilestones = await tx.milestone.findMany({
        where: { assignmentId },
      });
      const progressPct = recomputeAssignmentProgress(allMilestones);
      let assignmentStatus = assignment.status;
      if (progressPct >= 100) assignmentStatus = 'COMPLETED';
      else if (progressPct > 0 && assignmentStatus === 'ASSIGNED')
        assignmentStatus = 'IN_PROGRESS';

      await tx.assignment.update({
        where: { id: assignmentId },
        data: { progressPercentage: progressPct, status: assignmentStatus },
      });

      await syncRequestProgressFromAssignment(
        tx,
        assignment.requestId,
        progressPct,
        assignmentStatus,
      );

      await tx.activityLog.create({
        data: {
          requestId: assignment.requestId,
          assignmentId,
          userId: user.id,
          action: ActivityAction.MILESTONE_CREATED,
          description: `Milestone created: ${dto.title}.`,
        },
      });
    });

    return this.query.findOne(assignmentId, user);
  }

  async updateMilestone(
    assignmentId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
    user: RequestUser,
  ) {
    const accessCtx =
      await this.access.loadAssignmentAccessContext(assignmentId);
    this.access.assertCanMutateAssignment(user, accessCtx);

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, assignmentId },
      include: { assignment: { include: { members: true, request: true } } },
    });
    if (!milestone) throw new NotFoundException('Milestone not found');

    const status = dto.status ? mapMilestoneStatusToDb(dto.status) : undefined;
    const progress =
      dto.progress === undefined
        ? undefined
        : Math.max(0, Math.min(100, dto.progress));
    let becameCompleted = false;

    await this.prisma.$transaction(async (tx) => {
      await tx.milestone.update({
        where: { id: milestoneId },
        data: {
          ...(dto.title ? { title: dto.title.trim() } : {}),
          ...(status ? { status } : {}),
          ...(progress !== undefined ? { progressPercentage: progress } : {}),
          ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
        },
      });

      const allMilestones = await tx.milestone.findMany({
        where: { assignmentId },
      });
      const progressPct = recomputeAssignmentProgress(allMilestones);
      let assignmentStatus = milestone.assignment.status;
      if (progressPct >= 100) assignmentStatus = 'COMPLETED';
      else if (progressPct > 0 && assignmentStatus === 'ASSIGNED')
        assignmentStatus = 'IN_PROGRESS';
      becameCompleted =
        assignmentStatus === 'COMPLETED' &&
        milestone.assignment.status !== 'COMPLETED';

      await tx.assignment.update({
        where: { id: assignmentId },
        data: { progressPercentage: progressPct, status: assignmentStatus },
      });

      await syncRequestProgressFromAssignment(
        tx,
        milestone.assignment.requestId,
        progressPct,
        assignmentStatus,
      );

      await tx.activityLog.create({
        data: {
          requestId: milestone.assignment.requestId,
          assignmentId,
          userId: user.id,
          action: ActivityAction.MILESTONE_UPDATED,
          description: `Milestone updated: ${milestone.title}.`,
        },
      });
    });

    const memberIds = milestone.assignment.members.map((m) => m.userId);
    await this.notifications.createMany(
      memberIds
        .filter((id) => id !== user.id)
        .map((userId) => ({
          userId,
          type: NotificationType.MILESTONE_UPDATED,
          title: 'Milestone updated',
          message: `Progress updated on ${milestone.assignment.request.requestNumber}.`,
          relatedRequestId: milestone.assignment.requestId,
          relatedAssignmentId: assignmentId,
          relatedMilestoneId: milestoneId,
        })),
    );

    if (becameCompleted) {
      await notifyRequesterWorkCompleted(
        this.notifications,
        this.prisma,
        milestone.assignment.request,
        assignmentId,
      );
    }

    return this.query.findOne(assignmentId, user);
  }
}
