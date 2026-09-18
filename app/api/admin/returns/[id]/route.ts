import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Return from "@/models/Return"
import ReturnItem from "@/models/ReturnItem"
import { requireAdmin } from "@/lib/api/auth"
import { notifyUser } from "@/lib/api/notify"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { RETURN_STATUS_TRANSITIONS, updateReturnSchema } from "@/lib/validation/return"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/admin/returns/[id] — admin only, any customer's return. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const returnDoc = await Return.findOne({ _id: id, deletedAt: null }).lean()
    if (!returnDoc) return notFound()

    const [items, order] = await Promise.all([
      ReturnItem.find({ returnId: id }).lean(),
      Order.findOne({ _id: returnDoc.orderId }).select("orderNumber userId status").lean(),
    ])

    return ok({ return: returnDoc, items, order })
  } catch (error) {
    return serverError("GET /api/admin/returns/[id] failed:", error)
  }
}

/**
 * PATCH /api/admin/returns/[id] — admin only. Updates status (with
 * transition validation), reason, and/or per-item quantity/condition.
 * `orderId` is never part of the update schema, so ownership can't change.
 *
 * Stock is intentionally never touched here — see the "return stock
 * handling" note in the Phase 4 report for why automatic restoration was
 * deliberately left out this phase.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = updateReturnSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const returnDoc = await Return.findOne({ _id: id, deletedAt: null })
    if (!returnDoc) return notFound()

    const { status, reason, items } = parsed.data

    let statusChanged = false
    if (status !== undefined && status !== returnDoc.status) {
      const allowedNext = RETURN_STATUS_TRANSITIONS[returnDoc.status]
      if (!allowedNext.includes(status)) {
        return conflict(`Cannot move a return from "${returnDoc.status}" to "${status}".`)
      }
      returnDoc.status = status
      statusChanged = true
    }

    if (reason !== undefined) returnDoc.reason = reason

    if (items && items.length > 0) {
      const returnItems = await ReturnItem.find({ returnId: returnDoc._id })
      const returnItemMap = new Map(returnItems.map((item) => [item._id.toString(), item]))

      const orderItemIds = returnItems.map((item) => item.orderItemId)
      const orderItems = await OrderItem.find({ _id: { $in: orderItemIds } })
      const orderItemMap = new Map(orderItems.map((item) => [item._id.toString(), item]))

      for (const update of items) {
        const returnItem = returnItemMap.get(update.id)
        if (!returnItem) return badRequest(`Return item ${update.id} does not belong to this return.`)

        if (update.quantity !== undefined) {
          const orderItem = orderItemMap.get(returnItem.orderItemId.toString())
          if (orderItem && update.quantity > orderItem.quantity) {
            return badRequest(`Quantity cannot exceed the originally purchased quantity (${orderItem.quantity}).`)
          }
          returnItem.quantity = update.quantity
        }
        if (update.condition !== undefined) returnItem.condition = update.condition
        await returnItem.save()
      }
    }

    await returnDoc.save()

    if (statusChanged) {
      try {
        const order = await Order.findOne({ _id: returnDoc.orderId }).select("userId orderNumber").lean()
        if (order) {
          await notifyUser(
            order.userId.toString(),
            "return_status_changed",
            "Return update",
            `Your return for order ${order.orderNumber} is now "${returnDoc.status}".`
          )
        }
      } catch (notifyError) {
        console.error("Failed to create return-status-changed notification:", notifyError)
      }
    }

    const refreshedItems = await ReturnItem.find({ returnId: returnDoc._id }).lean()

    return ok({ return: returnDoc.toObject(), items: refreshedItems })
  } catch (error) {
    return serverError("PATCH /api/admin/returns/[id] failed:", error)
  }
}
