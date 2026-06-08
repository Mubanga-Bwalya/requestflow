import { BadRequestException } from '@nestjs/common';
import { RequestStatus } from '@prisma/client';

const ALLOWED: Partial<Record<RequestStatus, RequestStatus[]>> = {
  SUBMITTED: ['ACCEPTED', 'REJECTED', 'NEEDS_INFORMATION', 'CANCELLED'],
  ACCEPTED: ['ASSIGNED', 'REJECTED', 'NEEDS_INFORMATION', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'NEEDS_INFORMATION', 'CANCELLED'],
  IN_PROGRESS: [
    'READY_FOR_REVIEW',
    'COMPLETED',
    'NEEDS_INFORMATION',
    'CANCELLED',
  ],
  NEEDS_INFORMATION: ['SUBMITTED', 'CANCELLED'],
  READY_FOR_REVIEW: ['COMPLETED', 'REOPENED', 'NEEDS_INFORMATION'],
  COMPLETED: ['APPROVED', 'REOPENED'],
  REOPENED: ['IN_PROGRESS', 'NEEDS_INFORMATION', 'CANCELLED'],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
  DRAFT: ['SUBMITTED', 'CANCELLED'],
};

export function assertRequestStatusTransition(
  from: RequestStatus,
  to: RequestStatus,
): void {
  if (from === to) return;
  const allowed = ALLOWED[from];
  if (!allowed?.includes(to)) {
    throw new BadRequestException(
      `Cannot change request status from ${from} to ${to}.`,
    );
  }
}
