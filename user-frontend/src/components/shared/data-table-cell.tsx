import { isValidElement, type ReactNode } from "react";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function parsePercent(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{1,3})%$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

export function strEmpty(raw: string | number | ReactNode): boolean {
  if (raw == null) return true;
  if (typeof raw === "string") return raw.trim() === "";
  return false;
}

export function DataTableCellContent({
  columnKey,
  raw,
  compact,
}: {
  columnKey: string;
  raw: string | number | ReactNode | undefined;
  compact?: boolean;
}) {
  if (isValidElement(raw)) return raw;

  const str = raw == null || strEmpty(raw) ? "—" : String(raw);
  const key = columnKey.toLowerCase();

  if (key.includes("status") || key === "active") return <StatusBadge status={str} />;
  if (key.includes("priority")) return <PriorityBadge priority={str} />;

  if (key.includes("progress")) {
    const pct = parsePercent(raw);
    if (pct == null) return <span className="text-sm text-zamtel-text">{str}</span>;
    return (
      <div className={cn("flex items-center gap-2.5", compact ? "w-full" : "min-w-0 md:min-w-[148px]")}>
        <div className="min-w-0 flex-1">
          <Progress value={pct} label={`${pct}% complete`} />
        </div>
        <span className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums text-brand-dark">{pct}%</span>
      </div>
    );
  }

  if (columnKey === "actionNeeded" || columnKey === "nextStep") {
    const needsAction = str !== "—" && str.trim().length > 0;
    return needsAction ? (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-magenta">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-magenta" aria-hidden />
        {str}
      </span>
    ) : (
      <span className="text-sm text-zamtel-muted">No action needed</span>
    );
  }

  if (columnKey === "deadline") {
    return <span className="text-sm tabular-nums text-zamtel-text md:whitespace-nowrap">{str}</span>;
  }

  if (columnKey === "department" || columnKey === "requestType") {
    return <span className="text-sm text-zamtel-muted">{str}</span>;
  }

  return (
    <span
      className={cn(
        "text-sm",
        columnKey === "title" || columnKey === "label" || columnKey === "name"
          ? "font-semibold text-brand-dark"
          : "text-zamtel-text",
      )}
    >
      {str}
    </span>
  );
}
