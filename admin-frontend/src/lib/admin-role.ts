const ADMIN_ROLE_NAMES = new Set(["Admin", "System Admin"]);

export function isAdminRole(roleName: string | null | undefined): boolean {
  return Boolean(roleName && ADMIN_ROLE_NAMES.has(roleName));
}
