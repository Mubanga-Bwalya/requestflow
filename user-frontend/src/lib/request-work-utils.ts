import type { RequestDetail } from "@/lib/requests-api";
import type { RequestStatus } from "@/types/request";
import type { Assignment } from "@/types/task";

const MANAGER_DECISION_STATUSES: RequestStatus[] = [
  "SUBMITTED",
  "ACCEPTED",
  "NEEDS_INFORMATION",
];

/** Manager accept / assign / decline panel — only before team work has started. */
export function managerShowDecisionPanel(status: RequestStatus): boolean {
  return MANAGER_DECISION_STATUSES.includes(status);
}

/** Milestones appear once the request is accepted and a team assignment exists. */
export function showWorkMilestones(req: Pick<RequestDetail, "assignmentId" | "status">): boolean {
  if (!req.assignmentId) return false;
  return !["SUBMITTED", "REJECTED", "CANCELLED"].includes(req.status);
}

export function canEditMilestones(
  userId: string | undefined,
  assignment: Assignment | null,
  canManageInbox: boolean,
): boolean {
  if (!userId || !assignment) return false;
  if (canManageInbox) return true;
  return assignment.members.some((m) => m.id === userId);
}

/** Assignment/request states that allow a manager to submit for requester review. */
export function assignmentReadyForReviewAllowed(
  requestStatus: RequestStatus,
  assignmentStatus: Assignment["status"],
): boolean {
  if (assignmentStatus === "COMPLETED") return false;
  if (assignmentStatus === "READY_FOR_REVIEW") {
    return requestStatus === "REOPENED";
  }
  return ["ASSIGNED", "IN_PROGRESS", "REOPENED"].includes(assignmentStatus);
}

/** Only the target-department manager may mark work ready for requester review. */
export function canManagerMarkReadyForReview(
  canManageInbox: boolean,
  requestStatus: RequestStatus,
  assignmentStatus: Assignment["status"],
): boolean {
  return (
    canManageInbox &&
    assignmentReadyForReviewAllowed(requestStatus, assignmentStatus)
  );
}
