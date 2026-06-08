"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useHeaderNotifications } from "@/hooks/use-header-notifications";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { UserMenu } from "@/components/layout/user-menu";

export function AppHeader({ title, onMenuOpen }: { title: string; onMenuOpen?: () => void }) {
  const router = useRouter();
  const { state, actions } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const notif = useHeaderNotifications(state.auth.userId);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!notifPanelRef.current?.contains(target)) notif.setOpen(false);
      if (!userMenuRef.current?.contains(target)) setUserMenuOpen(false);
    }
    if (notif.open || userMenuOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [notif.open, notif.setOpen, userMenuOpen]);

  function logout() {
    setUserMenuOpen(false);
    actions.logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 overflow-visible border-b border-brand-dark/10 bg-white px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuOpen ? (
          <button
            type="button"
            className="rf-clickable-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-brand-dark md:hidden"
            aria-label="Open navigation menu"
            onClick={onMenuOpen}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <h1 className="truncate text-lg font-semibold text-brand-dark">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <NotificationPanel
          open={notif.open}
          onToggle={() => notif.setOpen((v) => !v)}
          unreadCount={notif.unreadCount}
          notifications={notif.notifications}
          page={notif.page}
          totalPages={notif.totalPages}
          userId={state.auth.userId}
          onMarkAllRead={notif.markAllRead}
          onMarkRead={notif.markOneRead}
          markingRead={notif.markingRead}
          onLoadPage={(p) => void notif.loadNotifications(p)}
          onClose={() => notif.setOpen(false)}
          panelRef={notifPanelRef}
        />
        <UserMenu
          open={userMenuOpen}
          onToggle={() => setUserMenuOpen((v) => !v)}
          onClose={() => setUserMenuOpen(false)}
          displayName={state.profile.displayName}
          role={state.profile.role}
          avatarDataUrl={state.profile.avatarDataUrl ?? null}
          onLogout={logout}
          menuRef={userMenuRef}
        />
      </div>
    </header>
  );
}
