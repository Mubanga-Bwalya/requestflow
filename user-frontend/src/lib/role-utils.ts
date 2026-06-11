import type { RequestItem } from "@/types/request";

/** Role label helper only — do not use for inbox or authorization gating. */
export function isManagerRole(role?: string | null): boolean {
  return Boolean(role?.includes("Manager"));
}

/** Prefer a specific role title over the generic "Manager" label in the header. */
export function formatDisplayRole(roleName?: string | null, jobTitle?: string | null): string {
  const role = roleName?.trim();
  const title = jobTitle?.trim();
  if (role && role !== "Manager") return role;
  if (title) return title;
  if (role) return role;
  return "Employee";
}

export type ManagerInboxAuth = {
  managedDepartmentNames?: readonly string[] | null;
  inboxDepartmentName?: string | null;
};

/** True when the user is appointed manager of at least one department (from /auth/me). */
export function hasManagerInbox(auth: ManagerInboxAuth): boolean {
  if (auth.managedDepartmentNames?.length) return true;
  return Boolean(auth.inboxDepartmentName);
}

/** Department whose manager inbox the signed-in user should query. */
export function resolveInboxDepartment(auth: ManagerInboxAuth): string | null {
  return auth.inboxDepartmentName ?? auth.managedDepartmentNames?.[0] ?? null;
}

export function canAssignRequest(r: RequestItem): boolean {
  const hasAssignment = Boolean(r.assignedMembers?.trim());
  return !hasAssignment && (r.status === "SUBMITTED" || r.status === "ACCEPTED");
}
