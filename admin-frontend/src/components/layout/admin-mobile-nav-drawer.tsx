"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { AdminSidebarNav } from "@/components/layout/admin-sidebar-nav";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AdminMobileNavDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation menu">
      <button
        type="button"
        className="absolute inset-0 bg-brand-dark/50"
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside className="relative flex h-full w-[min(280px,88vw)] flex-col border-r border-brand-dark/20 bg-brand-dark px-3 py-4 text-white shadow-overlay">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 rounded-card border border-white/10 bg-white/5 px-3 py-3">
            <BrandLogo subtitle="Admin Portal" />
          </div>
          <button
            type="button"
            className="rf-clickable-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-white hover:bg-white/10"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <AdminSidebarNav onNavigate={onClose} />
      </aside>
    </div>
  );
}
