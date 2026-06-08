export const IS_PUBLIC_KEY = 'isPublic';

export const ASSIGNABLE_USER_ROLE_NAMES = [
  'Admin',
  'Employee',
  'Manager',
] as const;

export type AssignableUserRoleName =
  (typeof ASSIGNABLE_USER_ROLE_NAMES)[number];

export function isAssignableUserRoleName(
  name: string | null | undefined,
): name is AssignableUserRoleName {
  if (!name) return false;
  const normalized = name.trim().toLowerCase();
  return ASSIGNABLE_USER_ROLE_NAMES.some(
    (role) => role.toLowerCase() === normalized,
  );
}
