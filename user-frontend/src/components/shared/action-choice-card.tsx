"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "default" | "warning" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "border-brand-primary border-l-[3px] border-l-brand-magenta bg-brand-primary/8 ring-1 ring-brand-magenta/25 hover:border-brand-primary hover:bg-brand-primary/12",
  default: "border-zamtel-border bg-white hover:border-brand-primary/50 hover:bg-brand-primary/5",
  warning: "border-amber-300/60 bg-amber-50/80 hover:border-amber-400/60 hover:bg-amber-50",
  danger: "border-red-200/80 bg-red-50/50 hover:border-red-300 hover:bg-red-50",
};

export function ActionChoiceCard({
  title,
  description,
  variant = "default",
  onClick,
  disabled,
  disabledReason,
  dataTestId,
}: {
  title: string;
  description: string;
  variant?: Variant;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
  dataTestId?: string;
}) {
  const selected = variant === "primary";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      data-rf-testid={dataTestId}
      className={cn(
        "rf-clickable-tile rf-focus-ring relative w-full px-4 py-3.5",
        disabled ? "cursor-not-allowed opacity-50" : variantClasses[variant],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-dark">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-zamtel-muted">
            {disabled && disabledReason ? disabledReason : description}
          </p>
        </div>
        {selected ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white">
            <Check className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : (
          <span
            className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-zamtel-border bg-white"
            aria-hidden
          />
        )}
      </div>
    </button>
  );
}
