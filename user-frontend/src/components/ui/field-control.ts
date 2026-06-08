import { cn } from "@/lib/utils";

/** Shared styles for text inputs, selects, and date fields. */
export const loginFieldClassName = cn(
  "rf-login-field min-h-11 w-full rounded-control border border-zamtel-border bg-white text-base text-brand-dark md:text-sm",
  "transition-[border-color,background-color] duration-200 ease-rf motion-reduce:transition-none",
  "placeholder:text-zamtel-muted",
  "hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]",
);

export const fieldControlClassName = cn(
  "rf-field-control min-h-11 w-full rounded-control border border-zamtel-border bg-white text-base text-brand-dark md:text-sm",
  "transition-[border-color,background-color] duration-200 ease-rf motion-reduce:transition-none",
  "placeholder:text-zamtel-muted",
  "hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]",
  "disabled:cursor-not-allowed disabled:border-zamtel-border disabled:bg-zamtel-bg disabled:text-zamtel-muted",
  "aria-[invalid=true]:border-red-500 aria-[invalid=true]:bg-red-50/40",
);

export const fieldLabelClassName = "text-sm font-medium text-brand-dark";

export const fieldErrorClassName = "mt-1.5 text-xs font-medium text-red-700";
