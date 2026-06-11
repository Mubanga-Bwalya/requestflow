"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  message: string | null;
  onRetry?: () => void;
  className?: string;
};

export function ApiErrorBanner({ message, onRetry, className }: Props) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn("rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700", className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>{message}</p>
        {onRetry ? (
          <Button size="compact" variant="outline" onClick={onRetry} type="button">
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
