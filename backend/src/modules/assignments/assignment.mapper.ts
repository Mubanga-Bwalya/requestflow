import { AssignmentStatus, MilestoneStatus, Prisma } from '@prisma/client';

export function mapMilestoneStatusToDb(status?: string): MilestoneStatus {
  if (!status || status === 'TODO') return 'NOT_STARTED';
  if (status === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (status === 'BLOCKED') return 'BLOCKED';
  if (status === 'COMPLETED') return 'COMPLETED';
  return 'NOT_STARTED';
}

export function mapMilestoneStatusFromDb(status: MilestoneStatus): string {
  if (status === 'NOT_STARTED') return 'TODO';
  return status;
}

export function mapAssignmentStatusForUi(status: AssignmentStatus): string {
  if (status === 'NOT_STARTED') return 'ASSIGNED';
  return status;
}

export function recomputeAssignmentProgress(
  milestones: { progressPercentage: number }[],
): number {
  if (!milestones.length) return 0;
  const avg =
    milestones.reduce(
      (acc, m) => acc + Math.max(0, Math.min(100, m.progressPercentage)),
      0,
    ) / milestones.length;
  return Math.round(avg);
}

export async function syncRequestIfAssignmentCompleted(
  tx: Prisma.TransactionClient,
  requestId: string,
  assignmentStatus: AssignmentStatus,
) {
  if (assignmentStatus !== 'COMPLETED') return;
  await tx.request.update({
    where: { id: requestId },
    data: {
      status: 'COMPLETED',
      currentStage: 'Work completed',
      progressPercentage: 100,
      completedAt: new Date(),
    },
  });
}

export async function syncRequestProgressFromAssignment(
  tx: Prisma.TransactionClient,
  requestId: string,
  progressPct: number,
  assignmentStatus: AssignmentStatus,
) {
  if (assignmentStatus === 'COMPLETED') {
    await syncRequestIfAssignmentCompleted(tx, requestId, assignmentStatus);
    return;
  }
  await tx.request.update({
    where: { id: requestId },
    data: { progressPercentage: progressPct },
  });
}

export function mapAssignmentDetail(row: {
  id: string;
  title: string;
  status: AssignmentStatus;
  progressPercentage: number;
  deadline: Date | null;
  department: { name: string };
  request: { id: string; requestNumber: string };
  members: { user: { id: string; fullName: string } }[];
  milestones: {
    id: string;
    title: string;
    status: MilestoneStatus;
    progressPercentage: number;
    owner: { fullName: string };
  }[];
}) {
  return {
    id: row.id,
    title: row.title,
    relatedRequest: row.request.requestNumber,
    requestId: row.request.id,
    department: row.department.name,
    status: mapAssignmentStatusForUi(row.status),
    progress: row.progressPercentage,
    deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : '',
    members: row.members.map((m) => ({ id: m.user.id, name: m.user.fullName })),
    milestones: row.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      owner: m.owner.fullName,
      status: mapMilestoneStatusFromDb(m.status),
      progress: m.progressPercentage,
    })),
  };
}

export const ASSIGNMENT_LIST_INCLUDE = {
  department: { select: { name: true } },
  request: { select: { id: true, requestNumber: true } },
  members: { include: { user: { select: { id: true, fullName: true } } } },
  milestones: {
    include: { owner: { select: { fullName: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export const ASSIGNMENT_LIST_SUMMARY_INCLUDE = {
  department: { select: { name: true } },
  request: { select: { id: true, requestNumber: true } },
  members: { include: { user: { select: { id: true, fullName: true } } } },
  _count: { select: { milestones: true } },
} as const;

export function mapAssignmentListItem(row: {
  id: string;
  title: string;
  status: AssignmentStatus;
  progressPercentage: number;
  deadline: Date | null;
  department: { name: string };
  request: { id: string; requestNumber: string };
  members: { user: { id: string; fullName: string } }[];
  _count: { milestones: number };
}) {
  return {
    id: row.id,
    title: row.title,
    relatedRequest: row.request.requestNumber,
    requestId: row.request.id,
    department: row.department.name,
    status: mapAssignmentStatusForUi(row.status),
    progress: row.progressPercentage,
    deadline: row.deadline ? row.deadline.toISOString().slice(0, 10) : '',
    members: row.members.map((m) => ({ id: m.user.id, name: m.user.fullName })),
    milestones: [] as {
      id: string;
      title: string;
      owner: string;
      status: string;
      progress: number;
    }[],
    milestoneCount: row._count.milestones,
  };
}
