"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiNotification } from "@/lib/notifications-api";

type Props = {
  open: boolean;
  onToggle: () => void;
  unreadCount: number;
  notifications: ApiNotification[];
  page: number;
  totalPages: number;
  userId: string | undefined;
  onMarkAllRead: () => Promise<void>;
  onMarkRead: (id: string) => Promise<void>;
  markingRead?: boolean;
  onLoadPage: (page: number) => void;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement>;
};

export function NotificationPanel({
  open,
  onToggle,
  unreadCount,
  notifications,
  page,
  totalPages,
  userId,
  onMarkAllRead,
  onMarkRead,
  markingRead = false,
  onLoadPage,
  onClose,
  panelRef,
}: Props) {
  const router = useRouter();

  return (
    <div className="relative z-50" ref={panelRef}>
      <button
        type="button"
        className="rf-clickable-icon relative min-h-11 min-w-11 rounded-control p-2 text-brand-dark"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={onToggle}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-magenta px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-brand-dark/25 sm:hidden"
            aria-label="Close notifications"
            onClick={onClose}
          />
          <div
            className={cn(
              "rf-popover z-[60] flex flex-col overflow-hidden rounded-card border border-zamtel-border bg-white shadow-overlay",
              "fixed inset-x-3 top-[4.25rem] max-h-[min(28rem,calc(100dvh-5.5rem))]",
              "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-[min(360px,calc(100vw-2rem))]",
            )}
          >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zamtel-border px-4 py-3">
            <div>
              <p className="text-sm font-bold text-brand-dark">Notifications</p>
              {unreadCount > 0 ? (
                <p className="text-xs text-zamtel-muted">{unreadCount} unread</p>
              ) : null}
            </div>
            {unreadCount > 0 && userId ? (
              <button
                type="button"
                className="rf-text-link text-xs disabled:opacity-50"
                disabled={markingRead}
                onClick={() => void onMarkAllRead()}
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <ul className="rf-notif-scroll min-h-0 flex-1 overflow-y-auto sm:max-h-80">
            {notifications.length ? (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "border-b border-zamtel-border last:border-b-0",
                    !n.read && "border-l-[3px] border-l-brand-magenta bg-brand-magenta/[0.04]",
                  )}
                >
                  <button
                    type="button"
                    className="rf-clickable-row rf-focus-ring w-full px-4 py-3 text-left disabled:opacity-50"
                    disabled={markingRead}
                    onClick={async () => {
                      if (userId && !n.read) await onMarkRead(n.id);
                      onClose();
                      if (n.href) router.push(n.href);
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.read ? (
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-magenta"
                          aria-label="Unread"
                        />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !n.read ? "font-semibold text-brand-dark" : "font-medium text-zamtel-text")}>
                          {n.title}
                        </p>
                        <p className={cn("mt-0.5 text-xs leading-relaxed", !n.read ? "text-zamtel-text" : "text-zamtel-muted")}>
                          {n.message}
                        </p>
                        <p className="mt-1.5 text-[10px] text-zamtel-muted">{n.createdAt}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            ) : (
              <li className="p-4">
                <EmptyState
                  icon={Bell}
                  heading="No new notifications"
                  body="You're all caught up"
                  className="border-0 bg-transparent py-6 shadow-none"
                />
              </li>
            )}
          </ul>

          {totalPages > 1 ? (
            <div className="flex shrink-0 items-center justify-between border-t border-zamtel-border px-4 py-2.5">
              <Button type="button" size="compact" variant="outline" disabled={page <= 1} onClick={() => onLoadPage(page - 1)}>
                Prev
              </Button>
              <span className="text-xs text-zamtel-muted">
                {page} / {totalPages}
              </span>
              <Button
                type="button"
                size="compact"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => onLoadPage(page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
