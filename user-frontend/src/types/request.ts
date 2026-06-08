export type RequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "NEEDS_INFORMATION"
  | "ACCEPTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "COMPLETED"
  | "APPROVED"
  | "REOPENED"
  | "REJECTED"
  | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type RequestItem = {
  id: string;
  requestNumber: string;
  title: string;
  department: string;
  requestType: string;
  status: RequestStatus;
  progress: number;
  deadline: string;
  actionNeeded: string;
  requestedBy?: string;
  sourceDepartment?: string;
  priority?: Priority | string;
  assignedMembers?: string;
  updatedAt?: string;
};
