import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Payment from "@/models/Payment"
import Shipment from "@/models/Shipment"
import OrderStatusHistory from "@/models/OrderStatusHistory"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { requireUser } from "@/lib/api/auth"
import { notFound, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/orders/[id] — the order only if it belongs to the caller.
 *
 * Historical line items resolve product/variant info without filtering
 * `deletedAt`/`isActive` — a past order must keep showing what was actually
 * purchased even after a product is later discontinued or deactivated.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const order = await Order.findOne({ _id: id, userId: session.user.id, deletedAt: null }).lean()
    if (!order) return notFound()

    const [orderItems, payment, shipments, statusHistory] = await Promise.all([
      OrderItem.find({ orderId: id }).lean(),
      Payment.findOne({ orderId: id }).lean(),
      Shipment.find({ orderId: id, deletedAt: null }).sort({ createdAt: -1 }).lean(),
      OrderStatusHistory.find({ orderId: id }).sort({ changedAt: 1 }).lean(),
    ])

    const variantIds = orderItems.map((item) => item.variantId).filter(Boolean)
    const productIds = orderItems.map((item) => item.productId)

    const [variants, products] = await Promise.all([
      variantIds.length > 0 ? ProductVariant.find({ _id: { $in: variantIds } }).lean() : [],
      productIds.length > 0 ? Product.find({ _id: { $in: productIds } }).lean() : [],
    ])
    const variantMap = new Map(variants.map((variant) => [variant._id.toString(), variant]))
    const productsWithImages = await attachPrimaryImages(products)
    const productMap = new Map(productsWithImages.map((product) => [product._id.toString(), product]))

    const items = orderItems.map((item) => ({
      ...item,
      variant: item.variantId ? (variantMap.get(item.variantId.toString()) ?? null) : null,
      product: productMap.get(item.productId.toString()) ?? null,
    }))

    return ok({ order, items, payment, shipments, statusHistory })
  } catch (error) {
    return serverError("GET /api/orders/[id] failed:", error)
  }
}
