import Notification from "@/models/Notification"

/**
 * Best-effort notification creation for server-side business events. Always
 * wrapped in try/catch by callers — a notification failure must never fail
 * the order/status-change/etc. operation that triggered it.
 */
export async function notifyUser(userId: string, type: string, title: string, message: string) {
  return Notification.create({ userId, type, title, message })
}
