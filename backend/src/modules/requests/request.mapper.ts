import { RequestStatus } from '@prisma/client';

export function requestActionNeeded(
  status: RequestStatus,
  hasOpenMissing: boolean,
): string {
  if (status === 'NEEDS_INFORMATION' || hasOpenMissing)
    return 'Provide missing information';
  if (status === 'COMPLETED' || status === 'READY_FOR_REVIEW')
    return 'Approve or reopen';
  if (status === 'SUBMITTED') return 'Pending manager review';
  return 'None';
}

export const REQUEST_LIST_INCLUDE = {
  targetDepartment: { select: { name: true } },
  sourceDepartment: { select: { name: true } },
  template: { select: { id: true, name: true } },
  createdByUser: { select: { fullName: true } },
  missingInfoRequests: {
    where: { status: 'OPEN' as const },
    select: { status: true },
  },
  assignment: {
    select: {
      progressPercentage: true,
      members: { select: { user: { select: { fullName: true } } } },
    },
  },
} as const;

export function mapRequestListItem(row: {
  id: string;
  requestNumber: string;
  title: string;
  status: RequestStatus;
  progressPercentage: number;
  deadline: Date | null;
  priority: string;
  updatedAt: Date;
  targetDepartment: { name: string };
  sourceDepartment: { name: string };
  template: { name: string };
  createdByUser: { fullName: string };
  missingInfoRequests: { status: string }[];
  assignment: {
    progressPercentage: number;
    members: { user: { fullName: string } }[];
  } | null;
}) {
  const hasOpenMissing = row.missingInfoRequests.some(
    (m) => m.status === 'OPEN',
  );
  const overallProgress =
    row.assignment?.progressPercentage ?? row.progressPercentage;
  return {
    id: row.id,
    requestNumber: row.requestNumber,
    title: row.title,
    department: row.targetDepartment.name,
    requestType: row.template.name,
    status: row.status,
    progress: overallProgress,
    deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : '',
    actionNeeded: requestActionNeeded(row.status, hasOpenMissing),
    requestedBy: row.createdByUser.fullName,
    sourceDepartment: row.sourceDepartment.name,
    priority: row.priority,
    assignedMembers:
      row.assignment?.members.map((m) => m.user.fullName).join(', ') ?? '',
    updatedAt: row.updatedAt.toISOString(),
  };
}
