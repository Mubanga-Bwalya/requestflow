"use client";

import { ReactNode, useState } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { ShellTitleProvider, useShellTitle } from "@/lib/shell-title-context";

function AppShellInner({ children }: { children: ReactNode }) {
  const title = useShellTitle();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface-subtle">
      <AppSidebar />
      <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title={title} onMenuOpen={() => setMobileNavOpen(true)} />
        <main className="relative z-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

/** Persistent authenticated layout — mount once per portal session. */
export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <ShellTitleProvider>
        <AppShellInner>{children}</AppShellInner>
      </ShellTitleProvider>
    </RequireAuth>
  );
}

/** @deprecated Use AppShellLayout via (portal) route layout. Kept for gradual migration. */
export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-surface-subtle">
        <AppSidebar />
        <MobileNavDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader title={title} onMenuOpen={() => setMobileNavOpen(true)} />
          <main className="relative z-0 flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </RequireAuth>
  );
}
