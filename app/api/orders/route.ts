import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Product from "@/models/Product"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { requireUser } from "@/lib/api/auth"
import { performCheckout, CheckoutError } from "@/lib/api/checkout"
import { PromotionError } from "@/lib/api/promotion"
import { badRequest, conflict, created, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { parsePagination } from "@/lib/api/pagination"
import { createOrderSchema } from "@/lib/validation/order"

/** GET /api/orders — the authenticated user's own orders only, paginated. */
export async function GET(request: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    await connectToDatabase()

    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams)
    const filter = { userId: session.user.id, deletedAt: null }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ])

    const orderIds = orders.map((order) => order._id)
    const itemCounts =
      orderIds.length > 0
        ? await OrderItem.aggregate([
            { $match: { orderId: { $in: orderIds } } },
            { $group: { _id: "$orderId", itemCount: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } },
          ])
        : []
    const itemCountMap = new Map(itemCounts.map((entry) => [entry._id.toString(), entry]))

    // Line summaries (name/slug/image/quantity) so the list can show thumbnails and search by product
    // without an extra request per order. Historical products resolve without deletedAt/isActive filters.
    const lineRows =
      orderIds.length > 0
        ? await OrderItem.find({ orderId: { $in: orderIds } })
            .select("orderId productId variantId quantity")
            .lean()
        : []
    const lineProducts = await Product.find({ _id: { $in: lineRows.map((row) => row.productId) } })
      .select("name slug")
      .lean()
    const lineProductsWithImages = await attachPrimaryImages(lineProducts)
    const lineProductMap = new Map(lineProductsWithImages.map((product) => [product._id.toString(), product]))
    const linesByOrder = new Map<string, unknown[]>()
    for (const row of lineRows) {
      const product = lineProductMap.get(row.productId.toString())
      const key = row.orderId.toString()
      linesByOrder.set(key, [
        ...(linesByOrder.get(key) ?? []),
        {
          productId: row.productId,
          variantId: row.variantId,
          quantity: row.quantity,
          name: product?.name ?? "Unavailable product",
          slug: product?.slug ?? null,
          image: product?.primaryImage?.imageUrl ?? null,
        },
      ])
    }

    const items = orders.map((order) => ({
      ...order,
      itemCount: itemCountMap.get(order._id.toString())?.itemCount ?? 0,
      totalQuantity: itemCountMap.get(order._id.toString())?.totalQuantity ?? 0,
      lineItems: linesByOrder.get(order._id.toString()) ?? [],
    }))

    return ok({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    return serverError("GET /api/orders failed:", error)
  }
}

/**
 * POST /api/orders — checkout. Accepts only `addressId`; every price, total,
 * order number, and status is computed/generated server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { addressId, promotionCode } = parsed.data
    const result = await performCheckout(session.user.id, addressId, promotionCode)

    return created({
      order: result.order,
      items: result.orderItems,
      payment: result.payment,
      shipment: result.shipment,
      orderPromotion: result.orderPromotion,
    })
  } catch (error) {
    if (error instanceof CheckoutError) {
      return error.status === 409 ? conflict(error.message) : badRequest(error.message)
    }
    if (error instanceof PromotionError) {
      if (error.status === 404) return notFound(error.message)
      return badRequest(error.message)
    }
    return serverError("POST /api/orders failed:", error)
  }
}
