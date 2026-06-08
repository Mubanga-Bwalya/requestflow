import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatChip({
  href,
  value,
  label,
  description,
  icon: Icon,
  attention,
}: {
  href: string;
  value: number | string;
  label: string;
  description?: string;
  icon: LucideIcon;
  attention?: boolean;
}) {
  const hasAttention = attention && Number(value) > 0;

  return (
    <Link
      href={href}
      className={cn(
        "rf-clickable rf-focus-ring rf-card-interactive group flex min-h-[88px] flex-col justify-between rounded-card border p-4 shadow-card",
        "hover:-translate-y-px motion-reduce:hover:translate-y-0",
        hasAttention
          ? "border-brand-magenta/30 bg-brand-magenta/[0.04] hover:border-brand-magenta/40 hover:shadow-md"
          : "border-zamtel-border bg-white hover:border-brand-primary/25 hover:shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            hasAttention ? "bg-brand-magenta/10 text-brand-magenta" : "bg-brand-primary/10 text-brand-primary",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        {hasAttention ? (
          <span className="rounded-full bg-brand-magenta px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Action
          </span>
        ) : null}
      </div>
      <div className="mt-3">
        <p
          className={cn(
            "text-2xl font-bold tabular-nums",
            hasAttention ? "text-brand-magenta" : "text-brand-primary",
          )}
        >
          {value}
        </p>
        <p className="mt-1 text-sm font-semibold text-brand-dark">{label}</p>
        {description ? <p className="mt-0.5 text-xs text-zamtel-muted">{description}</p> : null}
      </div>
    </Link>
  );
}

export function DashboardStatSkeletons({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={`sk-${i}`} className="h-[88px] animate-pulse rounded-card border border-zamtel-border bg-white/80" />
      ))}
    </>
  );
}
