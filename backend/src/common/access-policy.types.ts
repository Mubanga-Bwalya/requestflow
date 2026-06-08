/** Minimal request row for authorization (no PII). */
export type RequestAccessContext = {
  id: string;
  createdByUserId: string;
  targetDepartmentId: string;
  memberUserIds: string[];
};

/** Minimal assignment row for authorization. */
export type AssignmentAccessContext = {
  id: string;
  departmentId: string;
  requestCreatedByUserId: string;
  memberUserIds: string[];
};
