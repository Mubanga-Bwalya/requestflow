import type { RequestDetail } from "@/lib/requests-api";
import type { RequestItem, RequestStatus } from "@/types/request";

/** Minimal request shape for manager inbox dialogs. */
export type InboxRequestRef = Pick<
  RequestItem,
  "id" | "requestNumber" | "title" | "deadline" | "requestedBy" | "status" | "assignedMembers"
>;

export function inboxRefFromDetail(req: RequestDetail): InboxRequestRef {
  return {
    id: req.id,
    requestNumber: req.requestNumber,
    title: req.title,
    deadline: req.deadline ?? "",
    requestedBy: req.createdBy.fullName,
    status: req.status,
    assignedMembers: undefined,
  };
}

export function canAssignFromDetail(status: RequestStatus): boolean {
  return status === "ACCEPTED";
}

export function managerCanActOnStatus(status: RequestStatus): boolean {
  return !["APPROVED", "REJECTED", "CANCELLED"].includes(status);
}
