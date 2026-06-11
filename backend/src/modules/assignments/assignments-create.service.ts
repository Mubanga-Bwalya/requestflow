import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, NotificationType, Prisma } from '@prisma/client';
import type { RequestUser } from '../../common/auth.types';
import { isDepartmentManager } from '../../common/department-manager';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentsQueryService } from './assignments-query.service';

@Injectable()
export class AssignmentsCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: AssignmentsQueryService,
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

    if (
      !isDepartmentManager(
        actor.id,
        request.targetDepartmentId,
        actor.managedDepartmentIds,
      )
    ) {
      throw new ForbiddenException(
        'Only the appointed manager of the target department can create assignments.',
      );
    }

    const members = await this.prisma.user.findMany({
      where: { id: { in: dto.memberUserIds }, isActive: true },
      select: { id: true, departmentId: true },
    });
    if (members.length !== dto.memberUserIds.length) {
      throw new BadRequestException('One or more member users not found.');
    }
    const outOfDept = members.filter(
      (m) => m.departmentId !== request.targetDepartmentId,
    );
    if (outOfDept.length) {
      throw new BadRequestException(
        'All assignees must belong to the request target department.',
      );
    }

    const deadline = request.deadline;
    const title = `${request.title} — assignment`;

    let assignment;
    try {
      assignment = await this.prisma.$transaction(async (tx) => {
        const fresh = await tx.request.findUnique({
          where: { id: request.id },
          select: {
            id: true,
            status: true,
            assignment: { select: { id: true } },
          },
        });
        if (!fresh)
          throw new NotFoundException(`Request not found: ${dto.requestId}`);
        if (fresh.assignment) {
          throw new ConflictException(
            'This request already has an assignment.',
          );
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
}
