export type Milestone = {
  id: string;
  title: string;
  owner: string;
  status: string;
  progress: number;
};

export type AssignmentMember = {
  id: string;
  name: string;
};

export type Assignment = {
  id: string;
  title: string;
  relatedRequest: string;
  department: string;
  status: "ASSIGNED" | "IN_PROGRESS" | "READY_FOR_REVIEW" | "COMPLETED" | "REOPENED" | "OVERDUE";
  progress: number;
  deadline: string;
  milestones: Milestone[];
  /** Present on list endpoints; use instead of loading full milestones. */
  milestoneCount?: number;
  members: AssignmentMember[];
};
