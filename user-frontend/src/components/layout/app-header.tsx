"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, UserRound } from "lucide-react";
import { useLocalStore } from "@/lib/local-store";
import { cn } from "@/lib/utils";

export function AppHeader({ title }: { title: string }) {
  const router = useRouter();
  const { state, actions } = useLocalStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => state.notifications.filter((n) => !n.read).length, [state.notifications]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [notifOpen]);

  const initials = state.profile.displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="relative flex items-center justify-between border-b border-brand-dark/10 bg-white/80 px-6 py-4 backdrop-blur">
      <div className="absolute left-0 top-0 h-full w-1 bg-brand-primary" aria-hidden />
      <div className="pl-2">
        <p className="text-lg font-semibold text-brand-dark">{title}</p>
        <p className="text-xs text-slate-600">RequestFlow</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            className="relative rounded-md p-2 text-brand-dark hover:bg-brand-primary/10"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell className="h-5 w-5" aria-hidden />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-lime px-1 text-[10px] font-bold text-brand-dark">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {notifOpen ? (
            <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-lg border border-brand-dark/10 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-brand-dark/10 bg-brand-primary/5 px-4 py-3">
                <p className="text-sm font-semibold text-brand-dark">Notifications</p>
                {unreadCount > 0 ? (
                  <button type="button" className="text-xs text-brand-primary hover:underline" onClick={() => actions.markAllNotificationsRead()}>
                    Mark all read
                  </button>
                ) : null}
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {state.notifications.length ? (
                  state.notifications.map((n) => (
                    <li key={n.id} className={cn("border-b border-brand-dark/5 px-4 py-3", !n.read && "bg-brand-primary/5")}>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => {
                          actions.markNotificationRead(n.id);
                          setNotifOpen(false);
                          if (n.href) router.push(n.href);
                        }}
                      >
                        <p className="text-sm font-medium text-brand-dark">{n.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                        <p className="mt-1 text-[10px] text-slate-500">{n.createdAt}</p>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-6 text-center text-sm text-slate-600">No notifications.</li>
                )}
              </ul>
            </div>
          ) : null}
        </div>

        <Link
          href="/account"
          className="flex items-center gap-3 rounded-lg border border-brand-dark/10 bg-white px-3 py-2 shadow-sm transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5"
          aria-label="Account and settings"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-dark">
            {state.profile.avatarDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold">{initials || <UserRound className="h-4 w-4" aria-hidden />}</span>
            )}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{state.profile.displayName}</p>
            <p className="text-xs text-slate-600">{state.profile.role}</p>
          </div>
          <UserRound className="h-4 w-4 text-brand-primary sm:hidden" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
