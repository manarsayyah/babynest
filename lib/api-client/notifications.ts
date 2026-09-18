import { apiFetch } from "@/lib/api-client/fetcher"

export type ApiNotification = {
  _id: string
  type: string
  title: string
  message: string
  isRead: boolean
  sentAt: string
}

export type NotificationsPage = {
  items: ApiNotification[]
  total: number
  totalPages: number
  unreadCount: number
}

/** GET /api/notifications — the caller's own notifications, newest first, with the real unread count. */
export async function fetchNotifications(page = 1, limit = 50): Promise<NotificationsPage> {
  return apiFetch<NotificationsPage>(`/api/notifications?page=${page}&limit=${limit}`, { cache: "no-store" })
}

/** PATCH /api/notifications/[id] — sets read/unread on the caller's own notification. */
export async function setNotificationRead(id: string, isRead: boolean): Promise<void> {
  await apiFetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isRead }),
  })
}

/** PATCH /api/notifications/read-all — marks all of the caller's unread notifications as read. */
export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/api/notifications/read-all", { method: "PATCH" })
}
