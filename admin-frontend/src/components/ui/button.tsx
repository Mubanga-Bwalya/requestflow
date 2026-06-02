import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "success" | "warning" | "destructive";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = "primary", className, ...props }: Props) {
  const variants: Record<Variant, string> = {
    primary: "bg-brand-primary text-white hover:bg-brand-dark",
    outline: "border border-brand-dark/20 bg-white/90 text-brand-dark hover:border-brand-primary/30 hover:bg-brand-primary/5",
    success: "bg-brand-lime text-brand-dark hover:opacity-90",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

