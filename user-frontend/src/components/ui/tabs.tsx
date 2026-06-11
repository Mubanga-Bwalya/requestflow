import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tabs({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function Tab({
  active,
  children,
  onClick,
}: {
  active?: boolean;
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
          ? "border-brand-primary/40 border-b-[3px] border-b-brand-primary bg-brand-primary/10 font-semibold text-brand-dark shadow-sm"
          : "border-zamtel-border bg-white text-zamtel-text hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-dark",
      )}
    >
      {children}
    </button>
  );
}
