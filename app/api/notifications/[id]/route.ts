import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Notification from "@/models/Notification"
import { requireUser } from "@/lib/api/auth"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateNotificationSchema } from "@/lib/validation/notification"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/notifications/[id] — only the caller's own notification. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const notification = await Notification.findOne({
      _id: id,
      userId: session.user.id,
      deletedAt: null,
    }).lean()
    if (!notification) return notFound()

    return ok(notification)
  } catch (error) {
    return serverError("GET /api/notifications/[id] failed:", error)
  }
}

/**
 * PATCH /api/notifications/[id] — only `isRead` is editable by the owner.
 * `userId`/`type`/`title`/`message`/`sentAt` are never part of this schema.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = updateNotificationSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const notification = await Notification.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!notification) return notFound()

    notification.isRead = parsed.data.isRead
    await notification.save()

    return ok(notification.toObject())
  } catch (error) {
    return serverError("PATCH /api/notifications/[id] failed:", error)
  }
}

/** DELETE /api/notifications/[id] — owner only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const notification = await Notification.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!notification) return notFound()

    notification.deletedAt = new Date()
    await notification.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/notifications/[id] failed:", error)
  }
}
