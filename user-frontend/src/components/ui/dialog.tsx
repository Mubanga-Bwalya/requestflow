"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        className="rf-dialog-overlay absolute inset-0 bg-brand-dark/60"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div
        className={cn(
          "rf-dialog-panel relative z-10 flex max-h-[min(90dvh,720px)] w-full flex-col overflow-hidden",
          "rounded-t-panel border border-zamtel-border bg-white shadow-overlay sm:max-h-[calc(100dvh-2rem)] sm:w-[min(720px,calc(100vw-2rem))] sm:rounded-panel",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-dialog-title"
      >
        <div className="shrink-0 border-b border-brand-dark/10 bg-brand-primary/5 px-4 py-4 sm:px-6">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zamtel-border sm:hidden" aria-hidden />
          <div className="h-1 w-12 rounded-full bg-brand-primary max-sm:hidden" aria-hidden />
          <p id="rf-dialog-title" className="mt-2 text-lg font-semibold text-brand-dark sm:mt-3">
            {title}
          </p>
          {description ? <p className="mt-1 text-sm text-zamtel-muted">{description}</p> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
}
