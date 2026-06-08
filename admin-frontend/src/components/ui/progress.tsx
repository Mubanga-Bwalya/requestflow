import { cn } from "@/lib/utils";

export function Progress({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const ariaLabel = label ?? `${pct}% complete`;
  const isEmpty = pct === 0;

  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full border border-zamtel-border bg-zamtel-bg shadow-[inset_0_1px_2px_rgba(1,82,23,0.06)]"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "h-full rounded-full bg-brand-primary transition-[width,opacity] duration-300 ease-out motion-reduce:transition-none",
          isEmpty && "min-w-[4px] opacity-40",
        )}
        style={{ width: isEmpty ? "4px" : `${pct}%` }}
      />
    </div>
  );
}
