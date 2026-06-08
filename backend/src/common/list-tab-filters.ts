import { AssignmentStatus, RequestStatus } from '@prisma/client';

export type ListTab = 'ALL' | 'NEEDS_ACTION' | 'IN_PROGRESS' | 'DONE';

const REQUEST_NEEDS_ACTION: RequestStatus[] = [
  'SUBMITTED',
  'NEEDS_INFORMATION',
];
const REQUEST_IN_PROGRESS: RequestStatus[] = [
  'ACCEPTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_REVIEW',
  'REOPENED',
];
const REQUEST_DONE: RequestStatus[] = [
  'COMPLETED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
];

const INBOX_IN_PROGRESS: RequestStatus[] = [...REQUEST_IN_PROGRESS];

const TASK_NEEDS_ACTION: AssignmentStatus[] = ['ASSIGNED'];
const TASK_IN_PROGRESS: AssignmentStatus[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'READY_FOR_REVIEW',
  'REOPENED',
  'NOT_STARTED',
];
const TASK_DONE: AssignmentStatus[] = ['COMPLETED'];

export function parseListTab(raw?: string): ListTab | undefined {
  if (
    raw === 'ALL' ||
    raw === 'NEEDS_ACTION' ||
    raw === 'IN_PROGRESS' ||
    raw === 'DONE'
  ) {
    return raw;
  }
  return undefined;
}

export function requestStatusesForTab(
  tab: ListTab,
  scope: 'mine' | 'inbox',
): RequestStatus[] | undefined {
  if (tab === 'ALL') return undefined;
  if (tab === 'NEEDS_ACTION') return REQUEST_NEEDS_ACTION;
  if (tab === 'IN_PROGRESS')
    return scope === 'inbox' ? INBOX_IN_PROGRESS : REQUEST_IN_PROGRESS;
  if (tab === 'DONE') return REQUEST_DONE;
  return undefined;
}

export function assignmentStatusesForTab(
  tab: ListTab,
): AssignmentStatus[] | undefined {
  if (tab === 'ALL') return undefined;
  if (tab === 'NEEDS_ACTION') return TASK_NEEDS_ACTION;
  if (tab === 'IN_PROGRESS') return TASK_IN_PROGRESS;
  if (tab === 'DONE') return TASK_DONE;
  return undefined;
}
