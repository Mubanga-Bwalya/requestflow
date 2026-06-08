import { NotificationType } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { resolveDepartmentManagerRecipientIds } from './department-manager-recipients';
import type { NotificationsService } from './notifications.service';

type RequestRef = {
  id: string;
  requestNumber: string;
  createdByUserId: string;
  targetDepartmentId: string;
};

async function assignmentIdForRequest(
  prisma: PrismaService,
  requestId: string,
): Promise<string | undefined> {
  const row = await prisma.assignment.findUnique({
    where: { requestId },
    select: { id: true },
  });
  return row?.id;
}

export async function notifyRequesterReadyForReview(
  notifications: NotificationsService,
  prisma: PrismaService,
  request: Pick<RequestRef, 'id' | 'requestNumber' | 'createdByUserId'>,
  assignmentId?: string,
) {
  const relatedAssignmentId =
    assignmentId ?? (await assignmentIdForRequest(prisma, request.id));
  await notifications.create({
    userId: request.createdByUserId,
    type: NotificationType.REQUEST_COMPLETED,
    title: 'Ready for your review',
    message: `${request.requestNumber} is ready for you to approve or send back.`,
    relatedRequestId: request.id,
    relatedAssignmentId: relatedAssignmentId,
  });
}

export async function notifyRequesterWorkCompleted(
  notifications: NotificationsService,
  prisma: PrismaService,
  request: Pick<RequestRef, 'id' | 'requestNumber' | 'createdByUserId'>,
  assignmentId?: string,
) {
  const relatedAssignmentId =
    assignmentId ?? (await assignmentIdForRequest(prisma, request.id));
  await notifications.create({
    userId: request.createdByUserId,
    type: NotificationType.REQUEST_COMPLETED,
    title: 'Work completed',
    message: `${request.requestNumber} has been completed and is ready for your approval.`,
    relatedRequestId: request.id,
    relatedAssignmentId: relatedAssignmentId,
  });
}

export async function notifyTeamRequestReopened(
  notifications: NotificationsService,
  prisma: PrismaService,
  request: RequestRef,
  excludeUserId?: string,
) {
  const dept = await prisma.department.findUnique({
    where: { id: request.targetDepartmentId },
    select: { managerUserId: true },
  });
  const recipientIds = new Set(
    await resolveDepartmentManagerRecipientIds(
      prisma,
      request.targetDepartmentId,
      dept?.managerUserId,
    ),
  );

  const assignment = await prisma.assignment.findUnique({
    where: { requestId: request.id },
    select: { id: true, members: { select: { userId: true } } },
  });
  for (const member of assignment?.members ?? []) {
    recipientIds.add(member.userId);
  }
  if (excludeUserId) recipientIds.delete(excludeUserId);

  if (!recipientIds.size) return;

  await notifications.createMany(
    [...recipientIds].map((userId) => ({
      userId,
      type: NotificationType.REQUEST_REOPENED,
      title: 'Request sent back',
      message: `${request.requestNumber} was sent back by the requester for more work.`,
      relatedRequestId: request.id,
      relatedAssignmentId: assignment?.id,
    })),
  );
}
