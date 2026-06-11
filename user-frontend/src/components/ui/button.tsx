import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "ghost"
  | "success"
  | "warning"
  | "destructive"
  | "accent";

export type ButtonSize = "default" | "compact";

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "border-2 border-transparent bg-brand-primary text-white shadow-sm",
    "hover:bg-brand-dark active:bg-brand-dark",
    "disabled:bg-brand-primary/35 disabled:text-white/95 disabled:shadow-none",
  ),
  outline: cn(
    "border-2 border-brand-primary bg-white text-brand-primary shadow-sm",
    "hover:bg-brand-primary/8 active:bg-brand-primary/12",
    "disabled:border-brand-primary/35 disabled:bg-zamtel-bg disabled:text-brand-primary/45 disabled:shadow-none",
  ),
  ghost: cn(
    "border-2 border-transparent bg-transparent text-brand-dark",
    "hover:bg-brand-primary/8 active:bg-brand-primary/12",
    "disabled:text-zamtel-muted disabled:bg-transparent",
  ),
  success: cn(
    "border-2 border-transparent bg-brand-lime text-brand-dark shadow-sm",
    "hover:brightness-95 active:brightness-90 disabled:opacity-60",
  ),
  warning: cn(
    "border-2 border-transparent bg-amber-500 text-white shadow-sm",
    "hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60",
  ),
  destructive: cn(
    "border-2 border-transparent bg-red-600 text-white shadow-sm",
    "hover:bg-red-700 active:bg-red-800 disabled:opacity-60",
  ),
  accent: cn(
    "border-2 border-transparent bg-brand-magenta text-white shadow-sm",
    "hover:opacity-90 active:opacity-95 disabled:opacity-50",
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-11 px-6 text-sm",
  compact: "min-h-9 px-4 text-xs",
};

export function buttonClassName(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  loading?: boolean;
}) {
  const { variant = "primary", size = "default", className, loading } = options ?? {};
  return cn(
    "rf-clickable rf-focus-ring inline-flex items-center justify-center rounded-control font-bold",
    "hover:-translate-y-px hover:shadow-md motion-reduce:hover:translate-y-0",
    "disabled:hover:translate-y-0 disabled:hover:shadow-sm",
    "disabled:cursor-not-allowed",
    loading && "cursor-wait opacity-80",
    sizeClasses[size],
    variantClasses[variant],
    className,
  );
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  size = "default",
  className,
  loading,
  disabled,
  "aria-busy": ariaBusy,
  ...props
}: Props) {
  const isLoading = loading ?? ariaBusy === true;
  return (
    <button
      className={buttonClassName({ variant, size, className, loading: isLoading })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    />
  );
}
