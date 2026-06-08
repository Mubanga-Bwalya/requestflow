import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tabs({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function Tab({
  active,
  attention,
  children,
  onClick,
}: {
  active?: boolean;
  attention?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rf-clickable rf-focus-ring min-h-11 rounded-control border px-3 py-2 text-sm font-medium sm:px-4",
        "hover:-translate-y-px hover:shadow-sm motion-reduce:hover:translate-y-0",
        active
          ? cn(
              "border-brand-primary/40 border-b-[3px] bg-brand-primary/10 font-semibold text-brand-dark shadow-sm",
              attention ? "border-b-brand-magenta" : "border-b-brand-magenta",
            )
          : attention
            ? "border-brand-magenta/25 bg-brand-magenta/[0.03] text-brand-dark hover:border-brand-magenta/40 hover:bg-brand-magenta/[0.06]"
            : "border-zamtel-border bg-white text-zamtel-muted hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-dark",
      )}
    >
      {children}
    </button>
  );
}
