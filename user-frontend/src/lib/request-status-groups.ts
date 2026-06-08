/** Tab buckets — filtering is done server-side via `tab` query param. */

export function statusLabel(status: string): string {
  const s = status.trim().toUpperCase().replaceAll(" ", "_");
  const labels: Record<string, string> = {
    SUBMITTED: "Waiting for review",
    ACCEPTED: "Accepted — assign team",
    ASSIGNED: "Assigned to team",
    IN_PROGRESS: "In progress",
    NEEDS_INFORMATION: "Needs more information",
    READY_FOR_REVIEW: "Ready for your approval",
    COMPLETED: "Work completed",
    APPROVED: "Approved by you",
    REOPENED: "Sent back for more work",
    REJECTED: "Declined",
    CANCELLED: "Cancelled",
    OVERDUE: "Overdue",
    DRAFT: "Draft",
  };
  return labels[s] ?? status.replaceAll("_", " ");
}

export type ListTabBucket = "ALL" | "NEEDS_ACTION" | "IN_PROGRESS" | "DONE";

export const LIST_TAB_LABELS: { id: ListTabBucket; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "NEEDS_ACTION", label: "Needs your action" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "DONE", label: "Finished" },
];
