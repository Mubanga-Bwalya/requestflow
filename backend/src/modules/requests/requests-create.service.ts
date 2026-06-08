import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityAction, NotificationType, Prisma } from '@prisma/client';
import { invalidateAdminStatsCache } from '../../common/cache/admin-stats-cache';
import { CacheKeys } from '../../common/cache/cache-keys';
import { CacheService } from '../../common/cache/cache.service';
import type { RequestUser } from '../../common/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveDepartmentManagerRecipientIds } from '../notifications/department-manager-recipients';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateRequestDto } from './dto/create-request.dto';
import {
  assertKnownFieldKeys,
  validateRequiredTemplateFields,
} from './request-field-validation';
import { resolveRequestDeadline } from './request-deadline.util';
import { RequestNumberService } from './request-number.service';
import { RequestsQueryService } from './requests-query.service';

const UNIQUE_VIOLATION = 'P2002';
const MAX_CREATE_ATTEMPTS = 5;

@Injectable()
export class RequestsCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly query: RequestsQueryService,
    private readonly requestNumbers: RequestNumberService,
    private readonly cache: CacheService,
  ) {}

  async create(dto: CreateRequestDto, actor: RequestUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: actor.id },
      include: { department: true },
    });
    if (!user?.departmentId) {
      throw new BadRequestException(
        'User must belong to a department to submit requests.',
      );
    }

    const targetDept = await this.prisma.department.findFirst({
      where: {
        name: { equals: dto.targetDepartmentName, mode: 'insensitive' },
        isActive: true,
      },
    });
    if (!targetDept) {
      throw new BadRequestException(
        `Unknown target department: ${dto.targetDepartmentName}`,
      );
    }

    const template = await this.prisma.requestTemplate.findFirst({
      where: {
        id: dto.templateId,
        departmentId: targetDept.id,
        isActive: true,
      },
      include: { fields: { where: { isActive: true } } },
    });
    if (!template) {
      throw new BadRequestException(
        'Template not found for the selected department.',
      );
    }

    const fieldByKey = new Map(template.fields.map((f) => [f.fieldKey, f]));
    assertKnownFieldKeys(template.fields, dto.fieldAnswers);
    validateRequiredTemplateFields(template.fields, dto.fieldAnswers);

    const deadline = resolveRequestDeadline(
      dto.deadline,
      template.fields,
      dto.fieldAnswers,
    );

    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
      const requestNumber = await this.requestNumbers.allocate();
      try {
        const request = await this.prisma.$transaction(async (tx) => {
          const created = await tx.request.create({
            data: {
              requestNumber,
              title: dto.title.trim(),
              description: dto.description?.trim() || null,
              createdByUserId: user.id,
              sourceDepartmentId: user.departmentId!,
              targetDepartmentId: targetDept.id,
              templateId: template.id,
              status: 'SUBMITTED',
              priority: dto.priority ?? 'MEDIUM',
              deadline,
              progressPercentage: 0,
              currentStage: 'Pending manager review',
              submittedAt: new Date(),
            },
          });

          for (const ans of dto.fieldAnswers) {
            const field = fieldByKey.get(ans.fieldKey);
            if (!field) continue;
            await tx.requestFieldAnswer.create({
              data: {
                requestId: created.id,
                templateFieldId: field.id,
                answerText: ans.answerText ?? null,
                answerJson:
                  ans.answerJson === undefined
                    ? Prisma.JsonNull
                    : (ans.answerJson as Prisma.InputJsonValue),
                fileUrl: ans.fileUrl ?? null,
              },
            });
          }

          await tx.activityLog.create({
            data: {
              requestId: created.id,
              userId: user.id,
              action: ActivityAction.REQUEST_SUBMITTED,
              description: `Request ${requestNumber} submitted by ${user.fullName}.`,
            },
          });

          return created;
        });

        const managerRecipients = await resolveDepartmentManagerRecipientIds(
          this.prisma,
          targetDept.id,
          targetDept.managerUserId,
        );
        if (managerRecipients.length) {
          await this.notifications.createMany(
            managerRecipients.map((userId) => ({
              userId,
              type: NotificationType.REQUEST_SUBMITTED,
              title: 'New request submitted',
              message: `${requestNumber} (${dto.title.trim()}) is awaiting review in ${targetDept.name}.`,
              relatedRequestId: request.id,
            })),
          );
        }

        await this.cache.del(CacheKeys.workspaceSummary(actor.id));
        await Promise.all(
          managerRecipients.map((uid) =>
            this.cache.del(CacheKeys.workspaceSummary(uid)),
          ),
        );
        await invalidateAdminStatsCache(this.cache);

        return this.query.findOne(request.id, actor);
      } catch (err) {
        lastError = err;
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === UNIQUE_VIOLATION &&
          attempt < MAX_CREATE_ATTEMPTS - 1
        ) {
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }
}
