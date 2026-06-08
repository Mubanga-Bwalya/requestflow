export const ASSIGNABLE_USER_ROLES = [
  { name: "Employee", label: "Employee" },
  { name: "Manager", label: "Manager" },
  { name: "Admin", label: "Admin" },
] as const;

export type AssignableUserRoleName = (typeof ASSIGNABLE_USER_ROLES)[number]["name"];

export function isAssignableUserRoleName(name: string): name is AssignableUserRoleName {
  const normalized = name.trim().toLowerCase();
  return ASSIGNABLE_USER_ROLES.some((role) => role.name.toLowerCase() === normalized);
}

/** Maps legacy DB role names to the three assignable options. */
export function normalizeAssignableRole(roleName: string | null | undefined): AssignableUserRoleName | "" {
  if (!roleName) return "";
  if (isAssignableUserRoleName(roleName)) return roleName;
  if (roleName === "Admin" || roleName === "System Admin") return "Admin";
  if (roleName.includes("Manager")) return "Manager";
  return "Employee";
}
