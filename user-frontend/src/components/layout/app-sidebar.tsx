"use client";

import { BrandLogo } from "@/components/shared/brand-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-brand-dark/20 bg-brand-dark px-3 py-4 text-white md:block">
      <div className="mb-5 rounded-card border border-white/10 bg-white/5 px-3 py-3.5">
        <BrandLogo subtitle="Internal Requests" />
      </div>
      <SidebarNav />
    </aside>
  );
}
