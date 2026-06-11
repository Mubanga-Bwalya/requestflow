import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailField({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={cn("py-2.5", className)}>
      <dt className="text-xs font-bold uppercase tracking-wide text-brand-dark">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium leading-relaxed text-zamtel-text">{value}</dd>
    </div>
  );
}

export function MetadataChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zamtel-border bg-zamtel-bg px-2.5 py-1 text-xs font-medium text-zamtel-text">
      {children}
    </span>
  );
}
