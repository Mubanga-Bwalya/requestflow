import type { RequestItem } from "@/types/request";

export function isManagerRole(role?: string | null): boolean {
  return Boolean(role?.includes("Manager"));
}

export function canAssignRequest(r: RequestItem): boolean {
  const hasAssignment = Boolean(r.assignedMembers?.trim());
  return !hasAssignment && (r.status === "SUBMITTED" || r.status === "ACCEPTED");
}
