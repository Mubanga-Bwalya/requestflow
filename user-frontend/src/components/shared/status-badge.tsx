import { statusLabel } from "@/lib/request-status-groups";
import { cn } from "@/lib/utils";

function normalize(raw: string) {
  return raw.trim().toUpperCase().replaceAll(" ", "_").replaceAll("—", "-");
}

function statusClasses(status: string) {
  const s = normalize(status);

  if (s === "COMPLETED" || s === "APPROVED" || s === "WORK_COMPLETED") {
    return "border-brand-dark bg-brand-dark text-white";
  }

  if (s === "OVERDUE") {
    return "border-red-300 bg-red-50 text-red-800";
  }

  if (
    s === "NEEDS_INFORMATION" ||
    s === "NEEDS_MORE_INFORMATION" ||
    s === "REOPENED" ||
    s === "SENT_BACK_FOR_MORE_WORK" ||
    (s.includes("NEEDS") && s.includes("INFORMATION"))
  ) {
    return "border-brand-magenta/40 bg-brand-magenta/10 text-brand-magenta";
  }

  if (s === "READY_FOR_REVIEW" || s === "READY_FOR_YOUR_APPROVAL" || s === "WAITING_FOR_REVIEW") {
    return "border-brand-lime/50 bg-brand-lime/25 text-brand-dark";
  }

  if (
    s === "ASSIGNED" ||
    s === "ASSIGNED_TO_TEAM" ||
    s === "ACCEPTED" ||
    s === "ACCEPTED_-_ASSIGN_TEAM" ||
    s === "ACCEPTED_—_ASSIGN_TEAM" ||
    s === "SUBMITTED" ||
    s === "IN_PROGRESS"
  ) {
    return "border-brand-primary/40 bg-brand-primary/10 text-brand-dark";
  }

  if (s === "REJECTED" || s === "CANCELLED" || s === "DECLINED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (s === "DRAFT" || s === "TODO") {
    return "border-zamtel-border bg-zamtel-bg text-zamtel-muted";
  }

  return "border-zamtel-border bg-zamtel-bg text-zamtel-muted";
}

export function StatusBadge({ status, title }: { status: string; title?: string }) {
  const label = statusLabel(status);
  return (
    <span
      title={title ?? status}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-tight",
        statusClasses(status),
      )}
    >
      {label}
    </span>
  );
}
