import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import Shipment from "@/models/Shipment"
import { requireAdmin } from "@/lib/api/auth"
import { notifyUser } from "@/lib/api/notify"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateShipmentSchema } from "@/lib/validation/shipment"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/admin/orders/[id]/shipment — admin only. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, deletedAt: null }).select("_id").lean()
    if (!order) return notFound()

    const shipments = await Shipment.find({ orderId: id, deletedAt: null }).sort({ createdAt: -1 }).lean()
    return ok(shipments)
  } catch (error) {
    return serverError("GET /api/admin/orders/[id]/shipment failed:", error)
  }
}

/**
 * PATCH /api/admin/orders/[id]/shipment — admin only. Updates the order's
 * most recent active shipment (checkout in this phase always creates
 * exactly one per order).
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

    const parsed = updateShipmentSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, deletedAt: null }).select("userId orderNumber").lean()
    if (!order) return notFound()

    const shipment = await Shipment.findOne({ orderId: id, deletedAt: null }).sort({ createdAt: -1 })
    if (!shipment) return notFound("No shipment exists for this order.")

    const { status, shippedAt, deliveredAt, ...rest } = parsed.data
    Object.assign(shipment, rest)

    if (status !== undefined) {
      shipment.status = status
      // Auto-stamp a sensible timestamp only when the admin didn't supply
      // one explicitly and it isn't already set.
      if (status === "shipped" && !shipment.shippedAt && shippedAt === undefined) {
        shipment.shippedAt = new Date()
      }
      if (status === "delivered" && !shipment.deliveredAt && deliveredAt === undefined) {
        shipment.deliveredAt = new Date()
      }
    }
    if (shippedAt !== undefined) shipment.shippedAt = shippedAt
    if (deliveredAt !== undefined) shipment.deliveredAt = deliveredAt

    await shipment.save()

    if (status !== undefined) {
      try {
        await notifyUser(
          order.userId.toString(),
          "shipment_status_changed",
          "Shipment update",
          `The shipment for order ${order.orderNumber} is now "${status}".`
        )
      } catch (notifyError) {
        console.error("Failed to create shipment-status-changed notification:", notifyError)
      }
    }

    return ok(shipment.toObject())
  } catch (error) {
    return serverError("PATCH /api/admin/orders/[id]/shipment failed:", error)
  }
}
