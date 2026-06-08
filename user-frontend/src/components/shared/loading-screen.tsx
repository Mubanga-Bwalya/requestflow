import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingScreen({
  variant = "default",
  className,
}: {
  variant?: "default" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-screen w-full items-center justify-center",
        variant === "dark" ? "bg-brand-dark" : "bg-surface-subtle",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <Loader2
        className={cn(
          "h-10 w-10 animate-spin motion-reduce:animate-none",
          variant === "dark" ? "text-brand-lime" : "text-brand-primary",
        )}
        aria-hidden
      />
    </div>
  );
}
