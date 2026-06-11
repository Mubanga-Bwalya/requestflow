import { BadRequestException } from '@nestjs/common';
import { AssignmentStatus, RequestStatus } from '@prisma/client';

/** Requester may submit answers only while the request awaits clarification. */
export const STATUSES_ALLOWING_PROVIDE_INFORMATION: ReadonlySet<RequestStatus> =
  new Set(['NEEDS_INFORMATION']);

/**
 * Target-department manager may open a missing-information round during active review/work.
 * Excludes terminal states and when already awaiting the requester.
 */
export const STATUSES_ALLOWING_MISSING_INFO_REQUEST: ReadonlySet<RequestStatus> =
  new Set([
    'SUBMITTED',
    'ACCEPTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'READY_FOR_REVIEW',
    'REOPENED',
  ]);

export function assertCanProvideMissingInformation(
  status: RequestStatus,
): void {
  if (!STATUSES_ALLOWING_PROVIDE_INFORMATION.has(status)) {
    throw new BadRequestException(
      'Missing information can only be provided when the request status is NEEDS_INFORMATION.',
    );
  }
}

export function assertCanRequestMissingInformation(
  status: RequestStatus,
): void {
  if (!STATUSES_ALLOWING_MISSING_INFO_REQUEST.has(status)) {
    throw new BadRequestException(
      `Missing information cannot be requested while the request status is ${status}.`,
    );
  }
}

type AssignmentAlignment = {
  status: AssignmentStatus;
  progressPercentage: number;
};

/**
 * When an assignment exists, block direct request status jumps that skip assignment progress.
 */
export function assertRequestStatusAlignedWithAssignment(
  targetStatus: RequestStatus,
  assignment: AssignmentAlignment | null,
): void {
  if (!assignment) return;

  if (targetStatus === 'COMPLETED') {
    const aligned =
      assignment.status === 'COMPLETED' ||
      assignment.status === 'READY_FOR_REVIEW' ||
      assignment.progressPercentage >= 100;
    if (!aligned) {
      throw new BadRequestException(
        'Request cannot be marked completed until assignment work is completed or ready for review.',
      );
    }
  }

  if (targetStatus === 'READY_FOR_REVIEW') {
    const aligned = [
      'IN_PROGRESS',
      'READY_FOR_REVIEW',
      'COMPLETED',
      'REOPENED',
    ].includes(assignment.status);
    if (!aligned) {
      throw new BadRequestException(
        'Request cannot be marked ready for review until assignment work has started.',
      );
    }
  }
}
