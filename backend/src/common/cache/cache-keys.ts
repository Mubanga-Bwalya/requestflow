export const CacheKeys = {
  authUser: (userId: string) => `auth:user:${userId}`,
  workspaceSummary: (userId: string) => `workspace:summary:${userId}`,
  notificationUnread: (userId: string) => `notifications:unread-count:${userId}`,
  departmentsActive: 'departments:active',
  templatesDepartment: (departmentId: string) =>
    `templates:department:${departmentId}`,
  rolesAll: 'roles:all',
  settingsSystem: 'settings:system',
} as const;

export const CacheTtl = {
  authUserSeconds: 45,
  workspaceSummarySeconds: 20,
  notificationUnreadSeconds: 20,
  lookupSeconds: 300,
} as const;
