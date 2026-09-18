import connectToDatabase from "@/lib/db"
import Notification from "@/models/Notification"
import { requireUser } from "@/lib/api/auth"
import { ok, serverError } from "@/lib/api/response"

/** PATCH /api/notifications/read-all — marks only the caller's own unread notifications as read. */
export async function PATCH() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const result = await Notification.updateMany(
      { userId: session.user.id, deletedAt: null, isRead: false },
      { isRead: true }
    )

    return ok({ modifiedCount: result.modifiedCount })
  } catch (error) {
    return serverError("PATCH /api/notifications/read-all failed:", error)
  }
}
