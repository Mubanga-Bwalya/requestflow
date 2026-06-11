"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral:
    "border-brand-dark/25 bg-white text-brand-dark hover:border-brand-primary hover:bg-brand-primary/5",
  warning:
    "border-amber-800 bg-amber-50 text-amber-950 hover:border-amber-900 hover:bg-amber-100",
  danger: "border-red-800 bg-red-50 text-red-950 hover:border-red-900 hover:bg-red-100",
};

const iconClasses: Record<Tone, string> = {
  neutral: "text-brand-primary",
  warning: "text-amber-900",
  danger: "text-red-800",
};

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: Tone;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function RequestDetailManagerAction({
  icon: Icon,
  title,
  description,
  tone = "neutral",
  disabled,
  loading,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "rf-focus-ring rf-clickable flex w-full items-start gap-3 rounded-control border-2 p-4 text-left",
        "disabled:cursor-not-allowed disabled:opacity-55",
        toneClasses[tone],
      )}
    >
      <Icon className={cn("mt-0.5 h-6 w-6 shrink-0", iconClasses[tone])} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug">{loading ? `${title}…` : title}</span>
        <span className="mt-1 block text-sm leading-relaxed opacity-90">{description}</span>
      </span>
    </button>
  );
}
