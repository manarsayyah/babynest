import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import Return from "@/models/Return"
import ReturnItem from "@/models/ReturnItem"
import { requireUser } from "@/lib/api/auth"
import { conflict, notFound, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"

type RouteParams = { params: Promise<{ id: string }> }

/** True only if the return exists, isn't deleted, and its Order belongs to this user. */
async function findOwnedReturn(returnId: string, userId: string) {
  const returnDoc = await Return.findOne({ _id: returnId, deletedAt: null })
  if (!returnDoc) return null

  const order = await Order.findOne({ _id: returnDoc.orderId, userId, deletedAt: null }).select("_id").lean()
  if (!order) return null

  return returnDoc
}

/** GET /api/returns/[id] — only if the caller's own Order owns this return. Never another customer's. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const returnDoc = await findOwnedReturn(id, session.user.id)
    if (!returnDoc) return notFound()

    const items = await ReturnItem.find({ returnId: returnDoc._id }).lean()

    return ok({ return: returnDoc.toObject(), items })
  } catch (error) {
    return serverError("GET /api/returns/[id] failed:", error)
  }
}

/**
 * DELETE /api/returns/[id] — cancels a still-pending ("requested") return
 * request. Soft delete only, via the existing `deletedAt` field — no new
 * status value is introduced. Once admin has acted on it (approved,
 * rejected, or completed), it can no longer be cancelled by the customer.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const returnDoc = await findOwnedReturn(id, session.user.id)
    if (!returnDoc) return notFound()

    if (returnDoc.status !== "requested") {
      return conflict("Only a still-pending return request can be cancelled.")
    }

    returnDoc.deletedAt = new Date()
    await returnDoc.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/returns/[id] failed:", error)
  }
}
