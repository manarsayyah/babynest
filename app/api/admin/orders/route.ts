import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Payment from "@/models/Payment"
import Shipment from "@/models/Shipment"
import User from "@/models/User"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { ORDER_STATUSES } from "@/lib/validation/order"
import { PAYMENT_STATUSES } from "@/lib/validation/payment"

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "amount-desc": { total: -1 },
  "amount-asc": { total: 1 },
}

type Condition = Record<string, unknown>

/** Start of the window a `dateRange` filter selects — "30"/"90" days back, or Jan 1st of this year. */
function dateRangeStart(range: string): Date | null {
  const now = new Date()
  if (range === "year") return new Date(now.getFullYear(), 0, 1)
  if (range === "30" || range === "90") {
    const start = new Date(now)
    start.setDate(start.getDate() - Number(range))
    return start
  }
  return null
}

/**
 * GET /api/admin/orders — admin only. Paginated store-wide order list, each
 * row enriched with its customer, payment, latest shipment and item count,
 * plus catalog-wide status counts for the summary tiles.
 *
 * Filters: `status`, `userId`, `paymentStatus`, `dateRange` (30 | 90 | year),
 * `search` (order number, or the customer's name/email), `sort`.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const conditions: Condition[] = [{ deletedAt: null }]

    const status = searchParams.get("status")
    if (status) {
      if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
        return badRequest("Invalid status filter.")
      }
      conditions.push({ status })
    }

    const userId = searchParams.get("userId")
    if (userId) {
      if (!isValidObjectId(userId)) return badRequest("Invalid userId.")
      conditions.push({ userId })
    }

    // Payment status lives on Payment (1:1 with Order), so it resolves to order ids first.
    const paymentStatus = searchParams.get("paymentStatus")
    if (paymentStatus) {
      if (!(PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) {
        return badRequest("Invalid paymentStatus filter.")
      }
      const payments = await Payment.find({ status: paymentStatus as (typeof PAYMENT_STATUSES)[number] })
        .select("orderId")
        .lean()
      conditions.push({ _id: { $in: payments.map((payment) => payment.orderId) } })
    }

    const dateRange = searchParams.get("dateRange")
    if (dateRange) {
      const start = dateRangeStart(dateRange)
      if (!start) return badRequest("Invalid dateRange filter.")
      conditions.push({ createdAt: { $gte: start } })
    }

    const search = searchParams.get("search")?.trim()
    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean)
      // Every word must match the first or last name, so "sarah miller" finds Sarah Miller.
      const customers = await User.find({
        $or: [
          { email: { $regex: escapeRegex(search), $options: "i" } },
          {
            $and: tokens.map((token) => ({
              $or: [
                { firstName: { $regex: escapeRegex(token), $options: "i" } },
                { lastName: { $regex: escapeRegex(token), $options: "i" } },
              ],
            })),
          },
        ],
      })
        .select("_id")
        .lean()

      conditions.push({
        $or: [
          // A leading "#" is how order ids are usually written; the stored number has none.
          { orderNumber: { $regex: escapeRegex(search.replace(/^#/, "")), $options: "i" } },
          { userId: { $in: customers.map((customer) => customer._id) } },
        ],
      })
    }

    const sort = SORT_OPTIONS[searchParams.get("sort") ?? "newest"] ?? SORT_OPTIONS.newest
    const filter = { $and: conditions }

    const [orders, total, statusCounts] = await Promise.all([
      Order.find(filter).sort({ ...sort, _id: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
      Order.aggregate<{ _id: string; count: number }>([
        { $match: { deletedAt: null } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ])

    const orderIds = orders.map((order) => order._id)
    const userIds = [...new Set(orders.map((order) => order.userId.toString()))]

    const [users, payments, shipments, itemTotals] = await Promise.all([
      userIds.length > 0 ? User.find({ _id: { $in: userIds } }).select("firstName lastName email").lean() : [],
      orderIds.length > 0 ? Payment.find({ orderId: { $in: orderIds } }).lean() : [],
      orderIds.length > 0
        ? Shipment.find({ orderId: { $in: orderIds }, deletedAt: null }).sort({ createdAt: -1 }).lean()
        : [],
      orderIds.length > 0
        ? OrderItem.aggregate<{ _id: unknown; itemCount: number; totalQuantity: number }>([
            { $match: { orderId: { $in: orderIds } } },
            { $group: { _id: "$orderId", itemCount: { $sum: 1 }, totalQuantity: { $sum: "$quantity" } } },
          ])
        : [],
    ])

    const userById = new Map(users.map((user) => [user._id.toString(), user]))
    const paymentByOrder = new Map(payments.map((payment) => [payment.orderId.toString(), payment]))
    const shipmentByOrder = new Map<string, (typeof shipments)[number]>()
    for (const shipment of shipments) {
      // Sorted newest-first, so the first one seen per order is its latest shipment.
      const key = shipment.orderId.toString()
      if (!shipmentByOrder.has(key)) shipmentByOrder.set(key, shipment)
    }
    const totalsByOrder = new Map(itemTotals.map((entry) => [String(entry._id), entry]))

    const items = orders.map((order) => {
      const key = order._id.toString()
      const customer = userById.get(order.userId.toString())
      const payment = paymentByOrder.get(key)
      const shipment = shipmentByOrder.get(key)
      const totals = totalsByOrder.get(key)

      return {
        ...order,
        customer: customer
          ? { id: customer._id.toString(), name: `${customer.firstName} ${customer.lastName}`.trim(), email: customer.email }
          : null,
        itemCount: totals?.itemCount ?? 0,
        totalQuantity: totals?.totalQuantity ?? 0,
        payment: payment
          ? { method: payment.method, status: payment.status, amount: payment.amount, paidAt: payment.paidAt }
          : null,
        shipment: shipment
          ? { status: shipment.status, carrier: shipment.carrier ?? null, trackingNumber: shipment.trackingNumber ?? null }
          : null,
      }
    })

    const countFor = (name: string) => statusCounts.find((entry) => entry._id === name)?.count ?? 0

    return ok({
      items,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        total: statusCounts.reduce((sum, entry) => sum + entry.count, 0),
        pending: countFor("pending"),
        processing: countFor("processing"),
        delivered: countFor("delivered"),
        cancelled: countFor("cancelled"),
      },
    })
  } catch (error) {
    return serverError("GET /api/admin/orders failed:", error)
  }
}
