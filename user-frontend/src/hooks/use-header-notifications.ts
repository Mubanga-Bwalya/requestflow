"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type ApiNotification,
} from "@/lib/notifications-api";
import {
  matchesRefreshScope,
  subscribeAppRefresh,
  emitAppRefresh,
  type AppRefreshScope,
} from "@/lib/app-refresh";
import { NOTIFICATION_PAGE_SIZE } from "@/lib/page-size";
import { invalidateApiCache } from "@/lib/query-cache";

/** Poll only the bell badge — does not refresh page content. */
const NOTIFICATION_POLL_MS = 45_000;

export function useHeaderNotifications(userId: string | undefined) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingRead, setMarkingRead] = useState(false);

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    invalidateApiCache("notifications:unread");
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount((prev) => {
        if (count > prev) emitAppRefresh("requests");
        return count;
      });
    } catch {
      setUnreadCount(0);
    }
  }, [userId]);

  const refreshList = useCallback(
    async (p: number) => {
      if (!userId) {
        setNotifications([]);
        return;
      }
      invalidateApiCache("notifications:list:");
      try {
        const data = await fetchNotifications({ page: p, limit: NOTIFICATION_PAGE_SIZE });
        setNotifications(data.items);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch {
        setNotifications([]);
      }
    },
    [userId],
  );

  const refreshAll = useCallback(async () => {
    await refreshUnread();
    if (open) await refreshList(page);
  }, [open, page, refreshList, refreshUnread]);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread]);

  useEffect(() => {
    if (open && userId) {
      void refreshList(page);
      void refreshUnread();
    }
  }, [open, page, refreshList, refreshUnread, userId]);

  useEffect(() => {
    if (!userId) return;

    const onEvent = (scope: AppRefreshScope) => {
      if (matchesRefreshScope(scope, ["notifications", "all"])) {
        void refreshAll();
      }
    };

    const unsub = subscribeAppRefresh(onEvent);
    const tick = () => {
      if (document.visibilityState === "visible") void refreshUnread();
    };

    const intervalId = window.setInterval(tick, NOTIFICATION_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);

    return () => {
      unsub();
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [refreshAll, refreshUnread, userId]);

  async function markAllRead() {
    if (markingRead || !userId) return;
    setMarkingRead(true);
    try {
      await markAllNotificationsRead();
      await refreshAll();
    } finally {
      setMarkingRead(false);
    }
  }

  async function markOneRead(notificationId: string) {
    if (markingRead || !userId) return;
    setMarkingRead(true);
    try {
      await markNotificationRead(notificationId);
      await refreshAll();
    } finally {
      setMarkingRead(false);
    }
  }

  return {
    open,
    setOpen,
    notifications,
    page,
    totalPages,
    unreadCount,
    loadNotifications: (p: number) => {
      setPage(p);
    },
    markAllRead,
    markOneRead,
    markingRead,
  };
}
