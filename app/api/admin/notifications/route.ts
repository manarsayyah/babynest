import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Notification from "@/models/Notification"
import User from "@/models/User"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { parsePagination } from "@/lib/api/pagination"
import { createNotificationSchema } from "@/lib/validation/notification"

/** GET /api/admin/notifications — admin only. Lists all notifications, optionally filtered by userId. */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const filter: Record<string, unknown> = { deletedAt: null }
    const userId = searchParams.get("userId")
    if (userId) {
      if (!isValidObjectId(userId)) return badRequest("Invalid userId.")
      filter.userId = userId
    }

    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(filter),
    ])

    return ok({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    return serverError("GET /api/admin/notifications failed:", error)
  }
}

/**
 * POST /api/admin/notifications — admin only. This is the one place a
 * `userId` is legitimately accepted from a request body: an admin is
 * explicitly targeting a specific customer, not acting on their own behalf,
 * and the caller's own admin role was already verified via requireAdmin().
 */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createNotificationSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const targetUser = await User.findOne({ _id: parsed.data.userId, deletedAt: null }).select("_id").lean()
    if (!targetUser) return badRequest("userId does not reference an existing user.")

    const notification = await Notification.create(parsed.data)

    return created(notification)
  } catch (error) {
    return serverError("POST /api/admin/notifications failed:", error)
  }
}
