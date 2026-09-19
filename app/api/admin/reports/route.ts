import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import Product from "@/models/Product"
import Category from "@/models/Category"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import { requireAdmin } from "@/lib/api/auth"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { isValidObjectId } from "@/lib/api/object-id"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-product-status"
import { classifyInventory, getVariantStockSummaries } from "@/lib/api/inventory"
import { ORDER_STATUSES } from "@/lib/validation/order"
import type {
  AdminReport,
  ReportDateRangeKey,
  ReportOrderStatus,
  ReportSalesPoint,
} from "@/lib/api-client/admin-reports"

const DAY_MS = 86_400_000
const RANGE_KEYS: readonly ReportDateRangeKey[] = ["today", "7d", "30d", "3m", "year", "custom"]
const MAX_CUSTOM_SPAN_DAYS = 3660
const TOP_PRODUCTS = 5
const LOWEST_RATED = 5

const round2 = (n: number) => Math.round(n * 100) / 100
const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** % change from `previous` to `current`, or null when there is no previous value (avoids divide-by-zero / Infinity / NaN). */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** Strict YYYY-MM-DD -> UTC midnight (ms), or null if it isn't a real calendar date. */
function parseDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const time = Date.parse(`${value}T00:00:00.000Z`)
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== value) return null
  const year = new Date(time).getUTCFullYear()
  return year >= 2000 && year <= 2100 ? time : null
}

type Window = { start: number; endExclusive: number }

/** Resolves a range key (+ custom dates) to a half-open UTC window [start, endExclusive), or an error message. */
function resolveWindow(key: ReportDateRangeKey, startParam: string | null, endParam: string | null, now: Date): Window | string {
  const today = startOfUtcDay(now).getTime()
  const nowEnd = now.getTime() + 1

  switch (key) {
    case "today":
      return { start: today, endExclusive: nowEnd }
    case "7d":
      return { start: today - 6 * DAY_MS, endExclusive: nowEnd }
    case "30d":
      return { start: today - 29 * DAY_MS, endExclusive: nowEnd }
    case "3m": {
      const y = now.getUTCFullYear()
      const m = now.getUTCMonth() - 3
      const daysInTargetMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
      return { start: Date.UTC(y, m, Math.min(now.getUTCDate(), daysInTargetMonth)), endExclusive: nowEnd }
    }
    case "year":
      return { start: Date.UTC(now.getUTCFullYear(), 0, 1), endExclusive: nowEnd }
    case "custom": {
      if (!startParam || !endParam) return "A custom range needs both a start and an end date."
      const start = parseDay(startParam)
      const end = parseDay(endParam)
      if (start === null || end === null) return "Dates must be real calendar dates in YYYY-MM-DD format."
      if (start > end) return "The start date can't be after the end date."
      if ((end - start) / DAY_MS + 1 > MAX_CUSTOM_SPAN_DAYS) return "The custom range is too long."
      // The end date is inclusive: the window runs to the start of the following day.
      return { start, endExclusive: end + DAY_MS }
    }
  }
}

/** Buckets daily revenue into a chart series: one point for a single day, daily up to 14 days, weekly up to 120, else monthly. */
function buildSeries(key: ReportDateRangeKey, window: Window, revenueByDay: Map<string, number>): ReportSalesPoint[] {
  const { start, endExclusive } = window
  const spanDays = Math.max(1, Math.ceil((endExclusive - start) / DAY_MS))
  const revenueBetween = (from: number, toExclusive: number) => {
    let total = 0
    for (let t = Math.max(from, start); t < Math.min(toExclusive, endExclusive); t += DAY_MS) total += revenueByDay.get(dayKey(t)) ?? 0
    return round2(total)
  }
  const shortDay = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

  if (spanDays <= 1) return [{ label: key === "today" ? "Today" : shortDay(start), value: revenueBetween(start, endExclusive) }]

  if (spanDays <= 14) {
    return Array.from({ length: spanDays }, (_, i) => ({ label: shortDay(start + i * DAY_MS), value: revenueBetween(start + i * DAY_MS, start + (i + 1) * DAY_MS) }))
  }

  if (spanDays <= 120) {
    return Array.from({ length: Math.ceil(spanDays / 7) }, (_, i) => ({
      label: `Week ${i + 1}`,
      value: revenueBetween(start + i * 7 * DAY_MS, start + (i + 1) * 7 * DAY_MS),
    }))
  }

  const first = new Date(start)
  const last = new Date(endExclusive - 1)
  const multiYear = first.getUTCFullYear() !== last.getUTCFullYear()
  const points: ReportSalesPoint[] = []
  for (let cursor = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1); cursor < endExclusive; ) {
    const from = new Date(cursor)
    const next = Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1)
    const label = from.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })
    points.push({ label: multiYear ? `${label} '${String(from.getUTCFullYear()).slice(2)}` : label, value: revenueBetween(cursor, next) })
    cursor = next
  }
  return points
}

/**
 * GET /api/admin/reports?range=today|7d|30d|3m|year|custom&start=YYYY-MM-DD&end=YYYY-MM-DD&categoryId=<id> — admin only.
 *
 * Sales follow the Dashboard's rule: the `total` of every live, non-cancelled order (a Cash on Delivery order counts
 * while its payment is pending). The category filter scopes the product and inventory sections (a category includes
 * its subcategories); revenue, orders and customers are store-wide. Inputs are validated — nothing from the query is
 * ever used as a MongoDB filter except an ObjectId that must match an existing category.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const params = request.nextUrl.searchParams
    const key = (params.get("range") ?? "30d") as ReportDateRangeKey
    if (!RANGE_KEYS.includes(key)) return badRequest("Invalid range.")

    const now = new Date()
    const window = resolveWindow(key, params.get("start"), params.get("end"), now)
    if (typeof window === "string") return badRequest(window)

    const categoryParam = params.get("categoryId")
    if (categoryParam && !isValidObjectId(categoryParam)) return badRequest("Invalid categoryId.")

    await connectToDatabase()

    const categories = await Category.find({ deletedAt: null }).select("name parentCategoryId").lean()
    let categoryScope: Set<string> | null = null
    if (categoryParam) {
      if (!categories.some((category) => category._id.toString() === categoryParam)) return badRequest("Unknown category.")
      // The chosen category plus every category below it.
      categoryScope = new Set([categoryParam])
      let grew = true
      while (grew) {
        grew = false
        for (const category of categories) {
          const parent = category.parentCategoryId?.toString()
          if (parent && categoryScope.has(parent) && !categoryScope.has(category._id.toString())) {
            categoryScope.add(category._id.toString())
            grew = true
          }
        }
      }
    }

    const start = new Date(window.start)
    const endExclusive = new Date(window.endExclusive)
    const duration = window.endExclusive - window.start
    const previousStart = new Date(window.start - duration)
    const inRange = { $gte: start, $lt: endExclusive }
    const inPrevious = { $gte: previousStart, $lt: start }
    const live = { deletedAt: null }
    const counted = { deletedAt: null, status: { $ne: "cancelled" as const } }

    type Totals = { revenue: number; orders: number; customers: number }
    const totalsFor = (createdAt: typeof inRange) =>
      Order.aggregate<Totals>([
        { $match: { ...counted, createdAt } },
        { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 }, customers: { $addToSet: "$userId" } } },
        { $project: { _id: 0, revenue: 1, orders: 1, customers: { $size: "$customers" } } },
      ])

    const [
      currentTotals,
      previousTotals,
      statusRows,
      previousOrderCount,
      dailyRows,
      soldRows,
      activeCustomers,
      newCustomers,
      buyers,
    ] = await Promise.all([
      totalsFor(inRange),
      totalsFor(inPrevious),
      Order.aggregate<{ _id: ReportOrderStatus; count: number }>([
        { $match: { ...live, createdAt: inRange } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ ...live, createdAt: inPrevious }),
      Order.aggregate<{ _id: string; revenue: number }>([
        { $match: { ...counted, createdAt: inRange } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, revenue: { $sum: "$total" } } },
      ]),
      // Units + revenue per product from the counted orders' line items in the period (one row per order item).
      OrderItem.aggregate<{ _id: unknown; unitsSold: number; revenue: number }>([
        { $lookup: { from: Order.collection.name, localField: "orderId", foreignField: "_id", as: "order" } },
        { $unwind: "$order" },
        { $match: { "order.deletedAt": null, "order.status": { $ne: "cancelled" }, "order.createdAt": inRange } },
        { $group: { _id: "$productId", unitsSold: { $sum: "$quantity" }, revenue: { $sum: "$subtotal" } } },
      ]),
      User.find({ role: "customer", deletedAt: null }).select("_id").lean(),
      User.countDocuments({ role: "customer", deletedAt: null, createdAt: inRange }),
      // Lifetime counted spend per buyer (for returning customers + average customer spend).
      Order.aggregate<{ _id: unknown; orders: number; spent: number }>([
        { $match: counted },
        { $group: { _id: "$userId", orders: { $sum: 1 }, spent: { $sum: "$total" } } },
      ]),
    ])

    // ---- key metrics ----------------------------------------------------------
    const cur = currentTotals[0] ?? { revenue: 0, orders: 0, customers: 0 }
    const prev = previousTotals[0] ?? { revenue: 0, orders: 0, customers: 0 }
    const statusCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0])) as Record<ReportOrderStatus, number>
    for (const row of statusRows) statusCounts[row._id] = row.count
    const totalOrders = ORDER_STATUSES.reduce((sum, status) => sum + statusCounts[status], 0)

    const metrics = {
      revenue: round2(cur.revenue),
      orderCount: totalOrders,
      averageOrderValue: cur.orders > 0 ? round2(cur.revenue / cur.orders) : 0,
      uniqueCustomers: cur.customers,
    }
    const previousAov = prev.orders > 0 ? prev.revenue / prev.orders : 0

    // ---- sales chart ------------------------------------------------------------
    const salesSeries = buildSeries(key, window, new Map(dailyRows.map((row) => [row._id, row.revenue])))

    // ---- products ---------------------------------------------------------------
    const inScope = (categoryId: { toString(): string }) => !categoryScope || categoryScope.has(categoryId.toString())

    // Historical sales keep resolving even if a product was deactivated/deleted since; only the category scope applies.
    const soldProducts = soldRows.length > 0 ? await Product.find({ _id: { $in: soldRows.map((row) => row._id) } }).select("name slug categoryId").lean() : []
    const soldProductById = new Map(soldProducts.map((product) => [product._id.toString(), product]))
    const topRows = soldRows
      .filter((row) => {
        const product = soldProductById.get(String(row._id))
        return product ? inScope(product.categoryId) : !categoryScope
      })
      .sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue)
      .slice(0, TOP_PRODUCTS)

    const lowestRatedDocs = await Product.find({
      deletedAt: null,
      isActive: true,
      reviewCount: { $gt: 0 },
      ...(categoryScope ? { categoryId: { $in: [...categoryScope] } } : {}),
    })
      .select("name slug rating reviewCount")
      .sort({ rating: 1, reviewCount: -1 })
      .limit(LOWEST_RATED)
      .lean()

    const withImages = await attachPrimaryImages([
      ...topRows.flatMap((row) => {
        const product = soldProductById.get(String(row._id))
        return product ? [{ _id: product._id }] : []
      }),
      ...lowestRatedDocs.map((doc) => ({ _id: doc._id })),
    ])
    const imageById = new Map(withImages.map((entry) => [entry._id.toString(), entry.primaryImage?.imageUrl ?? null]))

    const topSelling = topRows.map((row) => {
      const id = String(row._id)
      const product = soldProductById.get(id)
      return {
        id,
        name: product?.name ?? "Unavailable product",
        slug: product?.slug ?? "",
        image: imageById.get(id) ?? null,
        revenue: round2(row.revenue),
        unitsSold: row.unitsSold,
      }
    })
    const lowestRated = lowestRatedDocs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      image: imageById.get(doc._id.toString()) ?? null,
      rating: doc.rating,
      reviewCount: doc.reviewCount,
    }))

    // ---- customers --------------------------------------------------------------
    const customerIds = new Set(activeCustomers.map((customer) => customer._id.toString()))
    const buyerRows = buyers.filter((row) => customerIds.has(String(row._id)))
    const returningCustomers = buyerRows.filter((row) => row.orders >= 2).length
    const lifetimeSpend = buyerRows.reduce((sum, row) => sum + row.spent, 0)

    // ---- inventory (a current snapshot, not date-bound) ---------------------------
    const stockProducts = await Product.find({
      deletedAt: null,
      isActive: true,
      ...(categoryScope ? { categoryId: { $in: [...categoryScope] } } : {}),
    })
      .select("name price stock")
      .lean()
    const variantStock = stockProducts.length > 0 ? await getVariantStockSummaries(stockProducts.map((product) => product._id)) : new Map()

    let inventoryValue = 0
    const outOfStock: { id: string; name: string }[] = []
    const lowStock: { id: string; name: string }[] = []
    for (const product of stockProducts) {
      const id = product._id.toString()
      const variants = variantStock.get(id)
      inventoryValue += variants ? Math.max(0, product.price * variants.totalQty + variants.valueDelta) : product.stock * product.price
      // Shared variant-stock definition (lib/api/inventory.ts), identical to the Dashboard and AI Insights.
      const status = classifyInventory(product.stock, variants)
      if (status === "out") outOfStock.push({ id, name: product.name })
      else if (status === "low") lowStock.push({ id, name: product.name })
    }
    const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)
    outOfStock.sort(byName)
    lowStock.sort(byName)

    const report: AdminReport = {
      generatedAt: now.toISOString(),
      range: { key, start: start.toISOString(), end: endExclusive.toISOString(), previousStart: previousStart.toISOString() },
      metrics,
      changes: {
        revenue: percentChange(cur.revenue, prev.revenue),
        orderCount: percentChange(totalOrders, previousOrderCount),
        averageOrderValue: percentChange(metrics.averageOrderValue, previousAov),
        uniqueCustomers: percentChange(cur.customers, prev.customers),
      },
      salesSeries,
      orderStatus: statusCounts,
      totalOrders,
      products: { topSelling, lowestRated },
      customers: {
        newCustomers,
        returningCustomers,
        totalCustomers: customerIds.size,
        averageCustomerSpend: customerIds.size > 0 ? round2(lifetimeSpend / customerIds.size) : 0,
      },
      inventory: {
        threshold: LOW_STOCK_THRESHOLD,
        total: stockProducts.length,
        outOfStock,
        lowStock,
        inventoryValue: round2(inventoryValue),
      },
      categoryOptions: categories
        .map((category) => ({ _id: category._id.toString(), name: category.name, parentCategoryId: category.parentCategoryId ? category.parentCategoryId.toString() : null }))
        .sort(byName),
    }

    return ok(report)
  } catch (error) {
    return serverError("GET /api/admin/reports failed:", error)
  }
}
