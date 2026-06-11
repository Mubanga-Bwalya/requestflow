import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import {
  renderNotificationEmail,
  type NotificationEmailDetail,
} from './notification-email.template';

export type NotificationEmailDispatch = {
  userId: string;
  title: string;
  message: string;
  relatedRequestId?: string;
  relatedAssignmentId?: string;
};

const SETTINGS_ID = 'default';

/** READY_FOR_REVIEW -> "Ready for review" */
function humanize(value: string): string {
  const lower = value.replaceAll('_', ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Mirrors in-app notifications to the user's email address. Never throws. */
@Injectable()
export class NotificationEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async dispatch(input: NotificationEmailDispatch): Promise<void> {
    if (!this.email.isEnabled()) return;

    try {
      if (!(await this.emailNotificationsAllowed())) return;

      const user = await this.prisma.user.findUnique({
        where: { id: input.userId },
        select: { email: true, fullName: true, isActive: true },
      });
      if (!user?.isActive || !user.email?.includes('@')) return;

      await this.email.send({
        to: user.email,
        subject: `RequestFlow: ${input.title}`,
        html: renderNotificationEmail({
          recipientName: user.fullName,
          title: input.title,
          message: input.message,
          actionUrl: this.actionUrl(input),
          details: await this.requestDetails(input.relatedRequestId),
        }),
      });
    } catch {
      /* email must never break notification flows; transport logs failures */
    }
  }

  async dispatchMany(inputs: NotificationEmailDispatch[]): Promise<void> {
    for (const input of inputs) {
      await this.dispatch(input);
    }
  }

  private async emailNotificationsAllowed(): Promise<boolean> {
    const row = await this.prisma.systemSettings.findUnique({
      where: { id: SETTINGS_ID },
      select: { notifyOnStatusChange: true },
    });
    return row?.notifyOnStatusChange ?? true;
  }

  private async requestDetails(
    requestId?: string,
  ): Promise<NotificationEmailDetail[] | undefined> {
    if (!requestId) return undefined;
    const row = await this.prisma.request.findUnique({
      where: { id: requestId },
      select: {
        requestNumber: true,
        title: true,
        status: true,
        priority: true,
        deadline: true,
        progressPercentage: true,
        targetDepartment: { select: { name: true } },
        createdByUser: { select: { fullName: true } },
      },
    });
    if (!row) return undefined;

    const details: NotificationEmailDetail[] = [
      { label: 'Request', value: `${row.requestNumber} — ${row.title}` },
      { label: 'From', value: row.createdByUser.fullName },
      { label: 'Department', value: row.targetDepartment.name },
      { label: 'Status', value: humanize(row.status) },
      {
        label: 'Priority',
        value: humanize(row.priority),
        emphasis: row.priority === 'HIGH' || row.priority === 'URGENT',
      },
    ];
    if (row.deadline) {
      details.push({
        label: 'Deadline',
        value: row.deadline.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
    }
    if (row.progressPercentage > 0) {
      details.push({
        label: 'Progress',
        value: `${row.progressPercentage}%`,
      });
    }
    return details;
  }

  private actionUrl(input: NotificationEmailDispatch): string | undefined {
    const base = this.email.appBaseUrl();
    if (input.relatedRequestId) {
      return `${base}/requests/${input.relatedRequestId}`;
    }
    if (input.relatedAssignmentId) {
      return `${base}/tasks/${input.relatedAssignmentId}`;
    }
    return undefined;
  }
}
