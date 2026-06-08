import { cn } from "@/lib/utils";

function normalize(raw: string) {
  return raw.trim().toUpperCase().replaceAll(" ", "_").replaceAll("—", "-");
}

function statusClasses(status: string) {
  const s = normalize(status);

  if (s === "ACTIVE") return "border-brand-primary/35 bg-brand-primary/10 text-brand-primary";
  if (s === "INACTIVE" || s === "DISABLED") return "border-zamtel-border bg-zamtel-bg text-zamtel-muted";

  if (s === "COMPLETED" || s === "APPROVED" || s === "WORK_COMPLETED") {
    return "border-brand-dark bg-brand-dark text-white";
  }

  if (s === "OVERDUE") return "border-red-300 bg-red-50 text-red-800";

  if (
    s === "NEEDS_INFORMATION" ||
    s === "NEEDS_MORE_INFORMATION" ||
    s === "REOPENED" ||
    (s.includes("NEEDS") && s.includes("INFORMATION"))
  ) {
    return "border-brand-magenta/40 bg-brand-magenta/10 text-brand-magenta";
  }

  if (s === "READY_FOR_REVIEW" || s === "WAITING_FOR_REVIEW") {
    return "border-brand-lime/50 bg-brand-lime/25 text-brand-dark";
  }

  if (s === "ASSIGNED" || s === "ACCEPTED" || s === "SUBMITTED" || s === "IN_PROGRESS") {
    return "border-brand-primary/35 bg-brand-primary/10 text-brand-primary";
  }

  if (s === "REJECTED" || s === "CANCELLED") return "border-red-200 bg-red-50 text-red-700";

  return "border-zamtel-border bg-zamtel-bg text-zamtel-muted";
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-tight",
        statusClasses(status),
      )}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
