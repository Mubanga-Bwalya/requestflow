import { api } from "@/lib/api";
import { type PaginatedResponse } from "@/lib/pagination";
import { NOTIFICATION_PAGE_SIZE } from "@/lib/page-size";
import { emitAppRefresh } from "@/lib/app-refresh";
import { cachedApi, invalidateApiCache } from "@/lib/query-cache";

export type ApiNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  href?: string;
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  return cachedApi("notifications:unread", async () => {
    const { data } = await api.get<number>("/notifications/unread-count");
    return data;
  }, 2_000);
}

export async function fetchNotifications(
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<ApiNotification & { createdAt: string }>> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? NOTIFICATION_PAGE_SIZE;
  const key = `notifications:list:${page}:${limit}`;
  return cachedApi(key, async () => {
    const { data } = await api.get<PaginatedResponse<ApiNotification>>("/notifications", {
      params: { page, limit },
    });
    return {
      ...data,
      items: data.items.map((n) => ({ ...n, createdAt: formatRelativeTime(n.createdAt) })),
    };
  }, 15_000);
}

export function invalidateNotificationCaches() {
  invalidateApiCache("notifications:");
  emitAppRefresh("notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`, null);
  invalidateNotificationCaches();
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/mark-all-read", null);
  invalidateNotificationCaches();
}
