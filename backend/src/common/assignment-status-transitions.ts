import { BadRequestException } from '@nestjs/common';
import { AssignmentStatus } from '@prisma/client';

const ALLOWED: Partial<Record<AssignmentStatus, AssignmentStatus[]>> = {
  NOT_STARTED: ['ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'READY_FOR_REVIEW', 'CANCELLED'],
  IN_PROGRESS: ['READY_FOR_REVIEW', 'COMPLETED', 'REOPENED', 'CANCELLED'],
  READY_FOR_REVIEW: ['COMPLETED', 'REOPENED', 'IN_PROGRESS'],
  REOPENED: ['IN_PROGRESS', 'READY_FOR_REVIEW', 'CANCELLED'],
  COMPLETED: ['REOPENED'],
  CANCELLED: [],
};

export function assertAssignmentStatusTransition(
  from: AssignmentStatus,
  to: AssignmentStatus,
): void {
  if (from === to) return;
  const allowed = ALLOWED[from];
  if (!allowed?.includes(to)) {
    throw new BadRequestException(
      `Cannot change assignment status from ${from} to ${to}.`,
    );
  }
}
