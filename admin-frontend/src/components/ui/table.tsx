import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-card border border-zamtel-border bg-zamtel-bg shadow-card">
      <table className="min-w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-brand-dark/25 bg-brand-dark px-3 py-3 text-left text-xs font-bold uppercase tracking-wide text-white",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-zamtel-border bg-white px-3 py-3.5 text-zamtel-text", className)}>{children}</td>
  );
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="rf-table-row even:bg-brand-primary/[0.03] hover:bg-brand-primary/8">{children}</tr>;
}
