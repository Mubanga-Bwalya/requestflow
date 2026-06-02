export type MilestoneStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED"; export type Milestone = { id: string; title: string; owner: string; status: MilestoneStatus; progress: number; };
