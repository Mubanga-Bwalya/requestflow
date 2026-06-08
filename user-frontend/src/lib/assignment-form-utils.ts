const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MILESTONE_TITLE_MAX = 200;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export const MILESTONE_STATUS_OPTIONS = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export function milestoneStatusLabel(value: string): string {
  return MILESTONE_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export type MilestoneFieldErrors = {
  title?: string;
  owner?: string;
  deadline?: string;
};

export function validateMilestoneCreateInput(input: {
  title: string;
  ownerUserId: string;
  deadline: string;
  memberIds: string[];
}): MilestoneFieldErrors {
  const errors: MilestoneFieldErrors = {};
  const title = input.title.trim();

  if (!title) errors.title = "Milestone title is required.";
  else if (title.length > MILESTONE_TITLE_MAX) {
    errors.title = `Title must be ${MILESTONE_TITLE_MAX} characters or fewer.`;
  }

  if (!input.ownerUserId) errors.owner = "Choose who owns this milestone.";
  else if (!isValidUuid(input.ownerUserId)) errors.owner = "Selected owner is invalid.";
  else if (!input.memberIds.includes(input.ownerUserId)) {
    errors.owner = "Owner must be someone on this assignment.";
  }

  if (input.deadline.trim() && !isValidDateString(input.deadline.trim())) {
    errors.deadline = "Enter a valid deadline date.";
  }

  return errors;
}
