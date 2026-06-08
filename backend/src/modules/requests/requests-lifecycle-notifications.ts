import { NotificationType, RequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  notifyRequesterReadyForReview,
  notifyRequesterWorkCompleted,
  notifyTeamRequestReopened,
} from '../notifications/workflow-notifications';

type RequestRow = {
  id: string;
  requestNumber: string;
  createdByUserId: string;
  targetDepartmentId: string;
};

export async function notifyAfterRequestStatusChange(
  notifications: NotificationsService,
  prisma: PrismaService,
  existing: RequestRow,
  status: RequestStatus,
  actorUserId?: string,
): Promise<void> {
  if (status === 'ACCEPTED') {
    await notifications.create({
      userId: existing.createdByUserId,
      type: NotificationType.REQUEST_ACCEPTED,
      title: 'Request accepted',
      message: `${existing.requestNumber} was accepted and can proceed.`,
      relatedRequestId: existing.id,
    });
    return;
  }

  if (status === 'REJECTED') {
    await notifications.create({
      userId: existing.createdByUserId,
      type: NotificationType.REQUEST_REJECTED,
      title: 'Request rejected',
      message: `${existing.requestNumber} was rejected.`,
      relatedRequestId: existing.id,
    });
    return;
  }

  if (status === 'READY_FOR_REVIEW') {
    await notifyRequesterReadyForReview(notifications, prisma, existing);
    return;
  }

  if (status === 'COMPLETED') {
    await notifyRequesterWorkCompleted(notifications, prisma, existing);
    return;
  }

  if (status === 'REOPENED') {
    await notifyTeamRequestReopened(
      notifications,
      prisma,
      existing,
      actorUserId,
    );
    return;
  }

  if (status === 'APPROVED') {
    const dept = await prisma.department.findUnique({
      where: { id: existing.targetDepartmentId },
      select: { managerUserId: true },
    });
    if (dept?.managerUserId) {
      await notifications.create({
        userId: dept.managerUserId,
        type: NotificationType.REQUEST_APPROVED,
        title: 'Request approved',
        message: `${existing.requestNumber} was approved by the requester.`,
        relatedRequestId: existing.id,
      });
    }
  }
}
