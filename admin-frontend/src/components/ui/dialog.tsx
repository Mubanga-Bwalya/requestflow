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
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-brand-dark/60"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div className="absolute left-1/2 top-1/2 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl">
          <div className="border-b border-brand-dark/10 bg-brand-primary/5 px-6 py-4">
            <div className="h-1 w-12 rounded-full bg-brand-primary" aria-hidden />
            <p className="mt-3 text-lg font-semibold text-brand-dark">{title}</p>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <div className={cn("px-6 py-5")}>{children}</div>
        </div>
      </div>
    </div>
  );
}

