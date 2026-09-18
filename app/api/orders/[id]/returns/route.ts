import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Return from "@/models/Return"
import ReturnItem from "@/models/ReturnItem"
import { requireUser } from "@/lib/api/auth"
import { badRequest, conflict, created, notFound, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { createReturnSchema } from "@/lib/validation/return"

type RouteParams = { params: Promise<{ id: string }> }

/**
 * POST /api/orders/[id]/returns — the customer requests a return for one of
 * their own orders. Ownership is Return -> Order -> User; Return never
 * carries its own userId.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const parsed = createReturnSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!order) return notFound()

    // Reasonable existing business rule: only a delivered order has
    // physical goods in the customer's hands to send back.
    if (order.status !== "delivered") {
      return conflict("Only delivered orders are eligible for a return request.")
    }

    const orderItems = await OrderItem.find({ orderId: order._id })
    const orderItemMap = new Map(orderItems.map((item) => [item._id.toString(), item]))

    // Sum quantities already tied up in a non-rejected return for each
    // order item, so a customer can't return more than they actually have
    // left across multiple return requests.
    const existingReturnItems = await ReturnItem.find({
      orderItemId: { $in: orderItems.map((item) => item._id) },
    })
    const existingReturns =
      existingReturnItems.length > 0
        ? await Return.find({
            _id: { $in: existingReturnItems.map((item) => item.returnId) },
            deletedAt: null,
            status: { $ne: "rejected" },
          })
            .select("_id")
            .lean()
        : []
    const activeReturnIds = new Set(existingReturns.map((r) => r._id.toString()))
    const alreadyReturnedByItem = new Map<string, number>()
    for (const returnItem of existingReturnItems) {
      if (!activeReturnIds.has(returnItem.returnId.toString())) continue
      const key = returnItem.orderItemId.toString()
      alreadyReturnedByItem.set(key, (alreadyReturnedByItem.get(key) ?? 0) + returnItem.quantity)
    }

    for (const requested of parsed.data.items) {
      const orderItem = orderItemMap.get(requested.orderItemId)
      if (!orderItem) {
        return badRequest(`Order item ${requested.orderItemId} does not belong to this order.`)
      }
      const alreadyReturned = alreadyReturnedByItem.get(requested.orderItemId) ?? 0
      const remaining = orderItem.quantity - alreadyReturned
      if (requested.quantity > remaining) {
        return badRequest(
          `Cannot return ${requested.quantity} unit(s) of an item — only ${Math.max(0, remaining)} remain eligible.`
        )
      }
    }

    const returnDoc = await Return.create({
      orderId: order._id,
      reason: parsed.data.reason,
      status: "requested",
    })

    const returnItems = await ReturnItem.create(
      parsed.data.items.map((item) => ({
        returnId: returnDoc._id,
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        condition: item.condition,
      }))
    )

    return created({ return: returnDoc, items: returnItems })
  } catch (error) {
    return serverError("POST /api/orders/[id]/returns failed:", error)
  }
}
