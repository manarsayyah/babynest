import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Payment from "@/models/Payment"
import Shipment from "@/models/Shipment"
import OrderStatusHistory from "@/models/OrderStatusHistory"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import User from "@/models/User"
import { requireAdmin } from "@/lib/api/auth"
import { notifyUser } from "@/lib/api/notify"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateOrderStatusSchema } from "@/lib/validation/order"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/admin/orders/[id] — admin only, any customer's order. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, deletedAt: null }).lean()
    if (!order) return notFound()

    const [orderItems, payment, shipments, statusHistory, customer] = await Promise.all([
      OrderItem.find({ orderId: id }).lean(),
      Payment.findOne({ orderId: id }).lean(),
      Shipment.find({ orderId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      OrderStatusHistory.find({ orderId: id }).sort({ changedAt: 1 }).lean(),
      // Never selects `password` — admin views never expose auth secrets.
      User.findOne({ _id: order.userId }).select("firstName lastName email").lean(),
    ])

    const variantIds = orderItems.map((item) => item.variantId).filter(Boolean)
    const productIds = orderItems.map((item) => item.productId)

    const [variants, products] = await Promise.all([
      variantIds.length > 0 ? ProductVariant.find({ _id: { $in: variantIds } }).lean() : [],
      productIds.length > 0 ? Product.find({ _id: { $in: productIds } }).lean() : [],
    ])
    const variantMap = new Map(variants.map((variant) => [variant._id.toString(), variant]))
    const productMap = new Map(products.map((product) => [product._id.toString(), product]))

    const items = orderItems.map((item) => ({
      ...item,
      variant: item.variantId ? (variantMap.get(item.variantId.toString()) ?? null) : null,
      product: productMap.get(item.productId.toString()) ?? null,
    }))

    return ok({ order, customer, items, payment, shipments, statusHistory })
  } catch (error) {
    return serverError("GET /api/admin/orders/[id] failed:", error)
  }
}

/** PATCH /api/admin/orders/[id] — admin only. Updates status and always records OrderStatusHistory. */
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

    const parsed = updateOrderStatusSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, deletedAt: null })
    if (!order) return notFound()

    const { status, note } = parsed.data

    // No-op update: nothing changes, so no history row is recorded either.
    if (order.status === status) return ok(order.toObject())

    order.status = status
    await order.save()

    await OrderStatusHistory.create({ orderId: order._id, status, note })

    try {
      await notifyUser(
        order.userId.toString(),
        "order_status_changed",
        "Order status updated",
        `Your order ${order.orderNumber} is now "${status}".`
      )
    } catch (notifyError) {
      console.error("Failed to create order-status-changed notification:", notifyError)
    }

    return ok(order.toObject())
  } catch (error) {
    return serverError("PATCH /api/admin/orders/[id] failed:", error)
  }
}
