"use client";

import { ReactNode, useState } from "react";
import { RequireAdminAuth } from "@/components/auth/require-admin-auth";
import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminMobileNavDrawer } from "@/components/layout/admin-mobile-nav-drawer";
import { ShellTitleProvider, useShellTitle } from "@/lib/shell-title-context";

function AdminShellInner({ children }: { children: ReactNode }) {
  const title = useShellTitle();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-subtle">
      <AdminSidebar />
      <AdminMobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={title} onMenuOpen={() => setMobileNavOpen(true)} />
        <main className="rf-page-enter relative z-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function AdminShellLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdminAuth>
      <ShellTitleProvider>
        <AdminShellInner>{children}</AdminShellInner>
      </ShellTitleProvider>
    </RequireAdminAuth>
  );
}

/** @deprecated Use AdminShellLayout via (portal) route layout. */
export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <RequireAdminAuth>
      <div className="flex min-h-screen bg-surface-subtle">
        <AdminSidebar />
        <AdminMobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader title={title} onMenuOpen={() => setMobileNavOpen(true)} />
          <main className="rf-page-enter relative z-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </RequireAdminAuth>
  );
}
