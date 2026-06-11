const LABELS: Record<string, string> = {
  REQUEST_CREATED: "Request created",
  REQUEST_SUBMITTED: "Request submitted",
  REQUEST_ACCEPTED: "Request accepted",
  REQUEST_REJECTED: "Request declined",
  REQUEST_NEEDS_INFORMATION: "More information requested",
  REQUEST_ASSIGNED: "Request assigned",
  REQUEST_PROGRESS_UPDATED: "Request updated",
  REQUEST_COMPLETED: "Request completed",
  REQUEST_APPROVED: "Request approved",
  REQUEST_REOPENED: "Request sent back",
  ASSIGNMENT_CREATED: "Team assigned",
  ASSIGNMENT_MEMBER_ADDED: "Team member added",
  MILESTONE_CREATED: "Task created",
  MILESTONE_UPDATED: "Task updated",
  ATTACHMENT_UPLOADED: "File uploaded",
  NOTIFICATION_CREATED: "Notification sent",
  USER_SIGNED_IN: "Sign-in",
  ADMIN_USER_CHANGED: "User admin",
  ADMIN_SETTINGS_CHANGED: "Settings",
};

export function activityActionLabel(action: string): string {
  return LABELS[action] ?? action.replaceAll("_", " ").toLowerCase();
}
