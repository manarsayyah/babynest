import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Notification from "@/models/Notification"
import { requireUser } from "@/lib/api/auth"
import { ok, serverError } from "@/lib/api/response"
import { parsePagination } from "@/lib/api/pagination"

/** GET /api/notifications — only the authenticated user's own, non-deleted notifications. */
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams)
    const filter = { userId: session.user.id, deletedAt: null }

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, isRead: false }),
    ])

    return ok({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), unreadCount })
  } catch (error) {
    return serverError("GET /api/notifications failed:", error)
  }
}
