import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import Category from "@/models/Category"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import Review from "@/models/Review"
import { requireAdmin } from "@/lib/api/auth"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { ok, serverError } from "@/lib/api/response"

const DAY_MS = 86_400_000
const LOW_STOCK_THRESHOLD = 5
const RECENT_ORDER_COUNT = 6
const TOP_PRODUCT_COUNT = 4

const round2 = (n: number) => Math.round(n * 100) / 100

/** All bucketing is done in UTC so the same order always lands in the same bucket regardless of server timezone. */
const dayKey = (date: Date) => date.toISOString().slice(0, 10)
const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
const monthLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })

/** % change from `previous` to `current`, or null when there is no previous period to compare against. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * GET /api/admin/dashboard — admin only. Aggregates real store figures for the admin dashboard:
 * KPI totals with 30-day trends, revenue series per period, recent orders, top products and
 * fact-based highlights. "Sales" = the total of every non-cancelled order.
 */
export async function GET() {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const now = new Date()
    const today = startOfUtcDay(now)
    const last30Start = new Date(today.getTime() - 29 * DAY_MS)
    const prev30Start = new Date(last30Start.getTime() - 30 * DAY_MS)
    const seriesStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1))

    const liveOrders = { deletedAt: null, status: { $ne: "cancelled" as const } }

    const [
      salesTotal,
      salesLast30,
      salesPrev30,
      ordersTotal,
      ordersLast30,
      ordersPrev30,
      customersTotal,
      customersLast30,
      customersPrev30,
      productsTotal,
      dailyRevenue,
    ] = await Promise.all([
      Order.aggregate([{ $match: liveOrders }, { $group: { _id: null, sum: { $sum: "$total" } } }]),
      Order.aggregate([
        { $match: { ...liveOrders, createdAt: { $gte: last30Start } } },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]),
      Order.aggregate([
        { $match: { ...liveOrders, createdAt: { $gte: prev30Start, $lt: last30Start } } },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]),
      Order.countDocuments({ deletedAt: null }),
      Order.countDocuments({ deletedAt: null, createdAt: { $gte: last30Start } }),
      Order.countDocuments({ deletedAt: null, createdAt: { $gte: prev30Start, $lt: last30Start } }),
      User.countDocuments({ role: "customer", deletedAt: null }),
      User.countDocuments({ role: "customer", deletedAt: null, createdAt: { $gte: last30Start } }),
      User.countDocuments({ role: "customer", deletedAt: null, createdAt: { $gte: prev30Start, $lt: last30Start } }),
      Product.countDocuments({ deletedAt: null, isActive: true }),
      Order.aggregate<{ _id: string; revenue: number }>([
        { $match: { ...liveOrders, createdAt: { $gte: seriesStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, revenue: { $sum: "$total" } } },
      ]),
    ])

    const sum = (rows: { sum?: number }[]) => rows[0]?.sum ?? 0

    // ---- revenue series -----------------------------------------------------
    const revenueByDay = new Map(dailyRevenue.map((row) => [row._id, row.revenue]))
    const revenueBetween = (from: Date, toExclusive: Date) => {
      let total = 0
      for (let t = from.getTime(); t < toExclusive.getTime(); t += DAY_MS) total += revenueByDay.get(dayKey(new Date(t))) ?? 0
      return round2(total)
    }

    const series7d = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today.getTime() - (6 - i) * DAY_MS)
      return {
        label: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
        value: revenueBetween(day, new Date(day.getTime() + DAY_MS)),
      }
    })

    // 30 days as five 6-day buckets, labelled by the bucket's first day.
    const series30d = Array.from({ length: 5 }, (_, i) => {
      const from = new Date(last30Start.getTime() + i * 6 * DAY_MS)
      return {
        label: from.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
        value: revenueBetween(from, new Date(from.getTime() + 6 * DAY_MS)),
      }
    })

    const monthlySeries = (months: number) =>
      Array.from({ length: months }, (_, i) => {
        const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1 - i), 1))
        const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1))
        return { label: monthLabel(from), value: revenueBetween(from, to) }
      })

    // ---- recent orders ------------------------------------------------------
    const recent = await Order.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(RECENT_ORDER_COUNT).lean()
    const recentIds = recent.map((order) => order._id)
    const [recentUsers, recentItems] = await Promise.all([
      User.find({ _id: { $in: recent.map((order) => order.userId) } }).select("firstName lastName").lean(),
      OrderItem.find({ orderId: { $in: recentIds } }).sort({ createdAt: 1 }).lean(),
    ])
    const recentProducts = await Product.find({ _id: { $in: recentItems.map((item) => item.productId) } })
      .select("name")
      .lean()
    const userMap = new Map(recentUsers.map((user) => [user._id.toString(), user]))
    const productNameMap = new Map(recentProducts.map((product) => [product._id.toString(), product.name]))

    const recentOrders = recent.map((order) => {
      const items = recentItems.filter((item) => item.orderId.toString() === order._id.toString())
      const user = userMap.get(order.userId.toString())
      const first = items[0] ? (productNameMap.get(items[0].productId.toString()) ?? "Unavailable product") : "—"
      return {
        id: order._id.toString(),
        orderNumber: order.orderNumber,
        customer: user ? `${user.firstName} ${user.lastName}` : (order.shippingAddress?.fullName ?? "Unknown customer"),
        product: items.length > 1 ? `${first} +${items.length - 1} more` : first,
        amount: order.total,
        status: order.status,
        createdAt: order.createdAt,
      }
    })

    // ---- top products (best sellers among non-cancelled orders) --------------
    const topRows = await OrderItem.aggregate<{ _id: unknown; soldCount: number; revenue: number }>([
      { $lookup: { from: "orders", localField: "orderId", foreignField: "_id", as: "order" } },
      { $unwind: "$order" },
      { $match: { "order.deletedAt": null, "order.status": { $ne: "cancelled" } } },
      { $group: { _id: "$productId", soldCount: { $sum: "$quantity" }, revenue: { $sum: "$subtotal" } } },
      { $sort: { soldCount: -1, revenue: -1 } },
      { $limit: TOP_PRODUCT_COUNT },
    ])
    // Historical sales keep resolving even if a product was later deactivated/deleted (no isActive/deletedAt filter).
    const topProductDocs = await attachPrimaryImages(
      await Product.find({ _id: { $in: topRows.map((row) => row._id) } })
        .select("name slug categoryId")
        .lean()
    )
    const categories = await Category.find({ _id: { $in: topProductDocs.map((product) => product.categoryId) } })
      .select("name")
      .lean()
    const categoryMap = new Map(categories.map((category) => [category._id.toString(), category.name]))
    const topProductMap = new Map(topProductDocs.map((product) => [product._id.toString(), product]))

    const topProducts = topRows
      .map((row) => {
        const product = topProductMap.get(String(row._id))
        if (!product) return null
        return {
          id: product._id.toString(),
          name: product.name,
          slug: product.slug,
          image: product.primaryImage?.imageUrl ?? null,
          category: categoryMap.get(product.categoryId.toString()) ?? null,
          soldCount: row.soldCount,
          revenue: round2(row.revenue),
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)

    // ---- fact-based highlights (counted from the database — not generated text) ----
    const [pendingOrders, pendingReviews, lowStockProductIds] = await Promise.all([
      Order.countDocuments({ deletedAt: null, status: "pending" }),
      Review.countDocuments({ deletedAt: null, status: "pending" }),
      ProductVariant.distinct("productId", { deletedAt: null, stockQty: { $lte: LOW_STOCK_THRESHOLD } }),
    ])
    const lowStockProducts = lowStockProductIds.length
      ? await Product.countDocuments({ _id: { $in: lowStockProductIds }, deletedAt: null, isActive: true })
      : 0

    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
    const highlights: string[] = []
    if (pendingOrders > 0) highlights.push(`${plural(pendingOrders, "order is", "orders are")} waiting to be processed.`)
    if (lowStockProducts > 0) {
      highlights.push(
        `${plural(lowStockProducts, "product has", "products have")} a variant with ${LOW_STOCK_THRESHOLD} or fewer units in stock.`
      )
    }
    if (pendingReviews > 0) highlights.push(`${plural(pendingReviews, "review is", "reviews are")} awaiting approval.`)
    if (topProducts[0]) highlights.push(`Best seller: ${topProducts[0].name} (${topProducts[0].soldCount} sold).`)
    if (highlights.length === 0) highlights.push("No pending orders, pending reviews or low-stock products right now.")

    return ok({
      stats: {
        totalSales: round2(sum(salesTotal)),
        orders: ordersTotal,
        customers: customersTotal,
        products: productsTotal,
        trends: {
          sales: percentChange(sum(salesLast30), sum(salesPrev30)),
          orders: percentChange(ordersLast30, ordersPrev30),
          customers: percentChange(customersLast30, customersPrev30),
        },
      },
      salesSeries: { "7d": series7d, "30d": series30d, "3m": monthlySeries(3), "1y": monthlySeries(12) },
      recentOrders,
      topProducts,
      highlights,
    })
  } catch (error) {
    return serverError("GET /api/admin/dashboard failed:", error)
  }
}
