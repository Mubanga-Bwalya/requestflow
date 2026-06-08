import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityAction,
  NotificationType,
  Prisma,
  RequestStatus,
} from '@prisma/client';
import { notifyAfterRequestStatusChange } from './requests-lifecycle-notifications';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import { assertRequestStatusTransition } from '../../common/request-status-transitions';
import {
  assertCanProvideMissingInformation,
  assertCanRequestMissingInformation,
  assertRequestStatusAlignedWithAssignment,
} from '../../common/request-workflow-guards';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveDepartmentManagerRecipientIds } from '../notifications/department-manager-recipients';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ProvideMissingInformationDto,
  RequestMissingInformationDto,
  UpdateRequestStatusDto,
} from './dto/update-request-status.dto';
import { RequestsQueryService } from './requests-query.service';

@Injectable()
export class RequestsLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: RequestsQueryService,
    private readonly access: AccessPolicyService,
    private readonly cache: CacheService,
  ) {}

  private async invalidateWorkspace(userId: string) {
    await this.cache.del(CacheKeys.workspaceSummary(userId));
  }

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
        assignment: { select: { status: true, progressPercentage: true } },
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

    await this.invalidateWorkspace(existing.createdByUserId);
    await this.invalidateWorkspace(user.id);

    return this.query.findOne(id, user);
  }

  async provideMissingInformation(
    id: string,
    dto: ProvideMissingInformationDto,
    user: RequestUser,
  ) {
    const accessCtx = await this.access.loadRequestAccessContext(id);
    if (!accessCtx) throw new NotFoundException('Request not found');
    if (!this.access.isRequester(user, accessCtx.createdByUserId)) {
      throw new ForbiddenException(
        'Only the requester can provide missing information.',
      );
    }

    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        template: { include: { fields: true } },
        missingInfoRequests: {
          where: { status: 'OPEN' },
          include: { items: true },
        },
      },
    });
    if (!request) throw new NotFoundException('Request not found');

    assertCanProvideMissingInformation(request.status);

    const openReq = request.missingInfoRequests[0];
    if (!openReq) {
      throw new BadRequestException(
        'No open missing-information request for this record.',
      );
    }

    const fieldByKey = new Map(
      request.template.fields.map((f) => [f.fieldKey, f]),
    );

    await this.prisma.$transaction(async (tx) => {
      for (const ans of dto.fieldAnswers) {
        const field = fieldByKey.get(ans.fieldKey);
        if (!field) continue;
        await tx.requestFieldAnswer.upsert({
          where: {
            requestId_templateFieldId: {
              requestId: id,
              templateFieldId: field.id,
            },
          },
          create: {
            requestId: id,
            templateFieldId: field.id,
            answerText: ans.answerText ?? null,
            answerJson:
              ans.answerJson === undefined
                ? Prisma.JsonNull
                : (ans.answerJson as Prisma.InputJsonValue),
          },
          update: {
            answerText: ans.answerText ?? null,
            answerJson:
              ans.answerJson === undefined
                ? Prisma.JsonNull
                : (ans.answerJson as Prisma.InputJsonValue),
          },
        });
      }

      await tx.missingInformationRequest.update({
        where: { id: openReq.id },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });

      await tx.missingInformationItem.updateMany({
        where: { missingInformationRequestId: openReq.id },
        data: { isResolved: true, resolvedAt: new Date() },
      });

      await tx.request.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          currentStage: 'Resubmitted after missing information',
        },
      });

      await tx.activityLog.create({
        data: {
          requestId: id,
          userId: user.id,
          action: ActivityAction.REQUEST_SUBMITTED,
          description: dto.note ?? 'Requester provided missing information.',
        },
      });
    });

    const dept = await this.prisma.department.findUnique({
      where: { id: request.targetDepartmentId },
      select: { id: true, managerUserId: true },
    });
    if (dept) {
      const managerRecipients = await resolveDepartmentManagerRecipientIds(
        this.prisma,
        dept.id,
        dept.managerUserId,
      );
      if (managerRecipients.length) {
        await this.notifications.createMany(
          managerRecipients.map((userId) => ({
            userId,
            type: NotificationType.REQUEST_SUBMITTED,
            title: 'Missing information provided',
            message: `${request.requestNumber} was updated and resubmitted.`,
            relatedRequestId: id,
          })),
        );
      }
    }

    return this.query.findOne(id, user);
  }

  async requestMissingInformation(
    id: string,
    dto: RequestMissingInformationDto,
    user: RequestUser,
  ) {
    const accessCtx = await this.access.loadRequestAccessContext(id);
    this.access.assertCanRequestMissingInformation(user, accessCtx);

    const request = await this.prisma.request.findUnique({
      where: { id },
      include: { template: { include: { fields: true } } },
    });
    if (!request) throw new NotFoundException('Request not found');

    assertCanRequestMissingInformation(request.status);

    const openMissing = await this.prisma.missingInformationRequest.findFirst({
      where: { requestId: id, status: 'OPEN' },
    });
    if (openMissing) {
      throw new BadRequestException(
        'A missing-information request is already open for this record.',
      );
    }

    const fieldByKey = new Map(
      request.template.fields.map((f) => [f.fieldKey, f]),
    );

    await this.prisma.$transaction(async (tx) => {
      const mir = await tx.missingInformationRequest.create({
        data: {
          requestId: id,
          requestedByUserId: user.id,
          status: 'OPEN',
        },
      });

      for (const item of dto.items) {
        const field = item.fieldKey ? fieldByKey.get(item.fieldKey) : undefined;
        await tx.missingInformationItem.create({
          data: {
            missingInformationRequestId: mir.id,
            templateFieldId: field?.id ?? null,
            reasonLabel: item.reasonLabel,
          },
        });
      }

      await tx.request.update({
        where: { id },
        data: {
          status: 'NEEDS_INFORMATION',
          currentStage: 'Awaiting requester clarification',
        },
      });

      await tx.activityLog.create({
        data: {
          requestId: id,
          userId: user.id,
          action: ActivityAction.REQUEST_NEEDS_INFORMATION,
          description: dto.note ?? 'Manager requested missing information.',
        },
      });
    });

    await this.notifications.create({
      userId: request.createdByUserId,
      type: NotificationType.REQUEST_NEEDS_INFORMATION,
      title: 'Information required',
      message: `${request.requestNumber} needs your input before work can continue.`,
      relatedRequestId: id,
    });

    return this.query.findOne(id, user);
  }
}
