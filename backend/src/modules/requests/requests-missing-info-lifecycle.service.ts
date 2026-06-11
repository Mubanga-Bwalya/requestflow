import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityAction, NotificationType, Prisma } from '@prisma/client';
import { AccessPolicyService } from '../../common/access-policy.service';
import type { RequestUser } from '../../common/auth.types';
import {
  assertCanProvideMissingInformation,
  assertCanRequestMissingInformation,
} from '../../common/request-workflow-guards';
import { CacheService } from '../../common/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveDepartmentManagerRecipientIds } from '../notifications/department-manager-recipients';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ProvideMissingInformationDto,
  RequestMissingInformationDto,
} from './dto/update-request-status.dto';
import { invalidateAfterRequestLifecycle } from './requests-lifecycle-cache';
import { RequestsQueryService } from './requests-query.service';

@Injectable()
export class RequestsMissingInfoLifecycleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: RequestsQueryService,
    private readonly access: AccessPolicyService,
    private readonly cache: CacheService,
  ) {}

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
      const openInTx = await tx.missingInformationRequest.findFirst({
        where: { requestId: id, status: 'OPEN' },
      });
      if (!openInTx) {
        throw new ConflictException(
          'No open missing-information request for this record.',
        );
      }

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

      const mirUpdated = await tx.missingInformationRequest.updateMany({
        where: { id: openInTx.id, status: 'OPEN' },
        data: { status: 'RESOLVED', resolvedAt: new Date() },
      });
      if (mirUpdated.count !== 1) {
        throw new ConflictException(
          'This request was updated by someone else. Please refresh and try again.',
        );
      }

      await tx.missingInformationItem.updateMany({
        where: { missingInformationRequestId: openInTx.id },
        data: { isResolved: true, resolvedAt: new Date() },
      });

      const requestUpdated = await tx.request.updateMany({
        where: { id, status: 'NEEDS_INFORMATION' },
        data: {
          status: 'SUBMITTED',
          currentStage: 'Resubmitted after missing information',
        },
      });
      if (requestUpdated.count !== 1) {
        throw new ConflictException(
          'This request was updated by someone else. Please refresh and try again.',
        );
      }

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

    await invalidateAfterRequestLifecycle(
      this.cache,
      request.createdByUserId,
      user.id,
    );

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
      const existingOpen = await tx.missingInformationRequest.findFirst({
        where: { requestId: id, status: 'OPEN' },
      });
      if (existingOpen) {
        throw new ConflictException(
          'A missing-information request is already open for this record.',
        );
      }

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

      const requestUpdated = await tx.request.updateMany({
        where: { id, status: request.status },
        data: {
          status: 'NEEDS_INFORMATION',
          currentStage: 'Awaiting requester clarification',
        },
      });
      if (requestUpdated.count !== 1) {
        throw new ConflictException(
          'This request was updated by someone else. Please refresh and try again.',
        );
      }

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

    await invalidateAfterRequestLifecycle(
      this.cache,
      request.createdByUserId,
      user.id,
    );

    return this.query.findOne(id, user);
  }
}
