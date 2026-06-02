import { cn } from "@/lib/utils";

type Props = {
  subtitle?: string;
  variant?: "sidebar" | "header";
  className?: string;
};

export function BrandLogo({ subtitle = "Internal Request System", variant = "sidebar", className }: Props) {
  const isSidebar = variant === "sidebar";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold uppercase tracking-wide",
          isSidebar ? "border-white/30 bg-white/10 text-white" : "border-brand-dark/20 bg-brand-primary/5 text-brand-dark",
        )}
        aria-label="Zamtel logo placeholder"
        title="Zamtel Logo (placeholder)"
      >
        Zamtel
      </div>

      <div className="min-w-0">
        <p className={cn("truncate text-sm font-semibold", isSidebar ? "text-white" : "text-brand-dark")}>RequestFlow</p>
        <p className={cn("truncate text-xs", isSidebar ? "text-white/80" : "text-slate-600")}>{subtitle}</p>
      </div>
    </div>
  );
}

