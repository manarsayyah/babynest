import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import User from "@/models/User"
import Product from "@/models/Product"
import Category from "@/models/Category"
import Order from "@/models/Order"
import OrderItem from "@/models/OrderItem"
import { requireAdmin } from "@/lib/api/auth"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-product-status"
import { classifyInventory, getVariantStockSummaries } from "@/lib/api/inventory"
import type { AdminInsights, InsightsPeriod, InsightsSalesPoint } from "@/lib/api-client/admin-insights"

const DAY_MS = 86_400_000
const PERIODS: readonly InsightsPeriod[] = ["7d", "30d", "3m", "1y"]
const TOP_PRODUCTS = 3
const TOP_CATEGORIES = 4
const NEEDS_ATTENTION = 3
const RESTOCK_CANDIDATES = 2
const HIGHLIGHT_MIN_RATING = 4.8

const round2 = (n: number) => Math.round(n * 100) / 100
const round1 = (n: number) => Math.round(n * 10) / 10

// Bucketing is in UTC — the same rule as GET /api/admin/dashboard — so an order always lands in the same bucket.
const dayKey = (date: Date) => date.toISOString().slice(0, 10)
const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
const monthLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })

/** % change from `previous` to `current`, or null when there is no previous value to compare against. */
function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/**
 * GET /api/admin/insights?period=7d|30d|3m|1y — admin only. Real store analytics for the AI Insights page.
 *
 * Definitions (shared with the Dashboard): "sales" = the `total` of every order that is not soft-deleted and not
 * cancelled; the payment method (Cash on Delivery) doesn't change it. Product lists only ever contain active,
 * non-deleted products. Stock = the sum of a product's live variant stock (that is what checkout decrements),
 * or `Product.stock` when the product has no variants. The recommendations are deterministic rules over these
 * figures — no AI/LLM is involved, and none is claimed.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const period = (request.nextUrl.searchParams.get("period") ?? "30d") as InsightsPeriod
    if (!PERIODS.includes(period)) return badRequest("Invalid period.")

    await connectToDatabase()

    const now = new Date()
    const today = startOfUtcDay(now)
    const last30Start = new Date(today.getTime() - 29 * DAY_MS)
    const prev30Start = new Date(last30Start.getTime() - 30 * DAY_MS)
    const seriesStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1))

    const liveOrders = { deletedAt: null, status: { $ne: "cancelled" as const } }

    const [
      salesLast30,
      salesPrev30,
      dailyRevenue,
      orderTotals,
      soldRows,
      products,
      variantStock,
      customersTotal,
      customersNew,
      repeatBuyers,
    ] = await Promise.all([
      Order.aggregate<{ sum: number }>([
        { $match: { ...liveOrders, createdAt: { $gte: last30Start } } },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]),
      Order.aggregate<{ sum: number }>([
        { $match: { ...liveOrders, createdAt: { $gte: prev30Start, $lt: last30Start } } },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]),
      Order.aggregate<{ _id: string; revenue: number }>([
        { $match: { ...liveOrders, createdAt: { $gte: seriesStart } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, revenue: { $sum: "$total" } } },
      ]),
      Order.aggregate<{ count: number; sum: number }>([
        { $match: liveOrders },
        { $group: { _id: null, count: { $sum: 1 }, sum: { $sum: "$total" } } },
      ]),
      // Units + revenue per product from counted orders' line items (all time), and units in the last 30 days.
      OrderItem.aggregate<{ _id: unknown; soldCount: number; revenue: number; soldLast30: number }>([
        { $lookup: { from: Order.collection.name, localField: "orderId", foreignField: "_id", as: "order" } },
        { $unwind: "$order" },
        { $match: { "order.deletedAt": null, "order.status": { $ne: "cancelled" } } },
        {
          $group: {
            _id: "$productId",
            soldCount: { $sum: "$quantity" },
            revenue: { $sum: "$subtotal" },
            soldLast30: { $sum: { $cond: [{ $gte: ["$order.createdAt", last30Start] }, "$quantity", 0] } },
          },
        },
      ]),
      Product.find({ deletedAt: null, isActive: true }).select("name slug stock rating reviewCount categoryId").lean(),
      getVariantStockSummaries(),
      User.countDocuments({ role: "customer", deletedAt: null }),
      User.countDocuments({ role: "customer", deletedAt: null, createdAt: { $gte: last30Start } }),
      Order.aggregate<{ _id: unknown }>([
        { $match: liveOrders },
        { $group: { _id: "$userId", orders: { $sum: 1 } } },
        { $match: { orders: { $gte: 2 } } },
      ]),
    ])

    const sum = (rows: { sum?: number }[]) => rows[0]?.sum ?? 0

    // ---- sales series (same buckets as the Dashboard) -----------------------
    const revenueByDay = new Map(dailyRevenue.map((row) => [row._id, row.revenue]))
    const revenueBetween = (from: Date, toExclusive: Date) => {
      let total = 0
      for (let t = from.getTime(); t < toExclusive.getTime(); t += DAY_MS) total += revenueByDay.get(dayKey(new Date(t))) ?? 0
      return round2(total)
    }
    const monthly = (months: number): InsightsSalesPoint[] =>
      Array.from({ length: months }, (_, i) => {
        const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (months - 1 - i), 1))
        const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1))
        return { label: monthLabel(from), value: revenueBetween(from, to) }
      })

    const seriesByPeriod: Record<InsightsPeriod, InsightsSalesPoint[]> = {
      "7d": Array.from({ length: 7 }, (_, i) => {
        const day = new Date(today.getTime() - (6 - i) * DAY_MS)
        return {
          label: day.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
          value: revenueBetween(day, new Date(day.getTime() + DAY_MS)),
        }
      }),
      // 30 days as five 6-day buckets, labelled by the bucket's first day.
      "30d": Array.from({ length: 5 }, (_, i) => {
        const from = new Date(last30Start.getTime() + i * 6 * DAY_MS)
        return {
          label: from.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
          value: revenueBetween(from, new Date(from.getTime() + 6 * DAY_MS)),
        }
      }),
      "3m": monthly(3),
      "1y": monthly(12),
    }

    const series = seriesByPeriod[period]
    const periodTotal = round2(series.reduce((acc, point) => acc + point.value, 0))
    const mid = Math.ceil(series.length / 2)
    const firstHalf = series.slice(0, mid).reduce((acc, point) => acc + point.value, 0)
    const secondHalf = series.slice(mid).reduce((acc, point) => acc + point.value, 0)
    const bestPoint = series.reduce((best, point) => (point.value > best.value ? point : best), series[0])

    // ---- products / inventory ------------------------------------------------
    const soldByProduct = new Map(soldRows.map((row) => [String(row._id), row]))

    const withStats = products.map((product) => {
      const id = product._id.toString()
      const sold = soldByProduct.get(id)
      return {
        ...product,
        id,
        // Availability is variant-level when the product has variants (checkout decrements ProductVariant.stockQty).
        availableStock: variantStock.get(id)?.totalQty ?? product.stock,
        inventoryStatus: classifyInventory(product.stock, variantStock.get(id)),
        soldCount: sold?.soldCount ?? 0,
        revenue: round2(sold?.revenue ?? 0),
        soldLast30: sold?.soldLast30 ?? 0,
      }
    })
    const withImages = await attachPrimaryImages(withStats)
    const imageById = new Map(withImages.map((product) => [product._id.toString(), product.primaryImage?.imageUrl ?? null]))
    const ref = (product: (typeof withStats)[number]) => ({ id: product.id, name: product.name, slug: product.slug })

    const topPerforming = withStats
      .filter((product) => product.soldCount > 0)
      .sort((a, b) => b.soldCount - a.soldCount || b.revenue - a.revenue)
      .slice(0, TOP_PRODUCTS)
      .map((product) => ({ ...ref(product), image: imageById.get(product.id) ?? null, soldCount: product.soldCount, revenue: product.revenue }))

    const needsAttention = withStats
      .filter((product) => product.reviewCount > 0)
      .sort((a, b) => a.rating - b.rating || b.reviewCount - a.reviewCount)
      .slice(0, NEEDS_ATTENTION)
      .map((product) => ({ ...ref(product), image: imageById.get(product.id) ?? null, rating: product.rating, reviewCount: product.reviewCount }))

    // Category revenue counts every sold product (even one deactivated since) but only categories that still exist.
    const soldProductDocs = soldRows.length > 0 ? await Product.find({ _id: { $in: soldRows.map((row) => row._id) } }).select("categoryId").lean() : []
    const categoryOfProduct = new Map(soldProductDocs.map((product) => [product._id.toString(), product.categoryId.toString()]))
    const revenueByCategory = new Map<string, number>()
    for (const row of soldRows) {
      const categoryId = categoryOfProduct.get(String(row._id))
      if (categoryId) revenueByCategory.set(categoryId, (revenueByCategory.get(categoryId) ?? 0) + row.revenue)
    }
    const categories = revenueByCategory.size > 0
      ? await Category.find({ _id: { $in: [...revenueByCategory.keys()] }, deletedAt: null }).select("name").lean()
      : []
    const rankedCategories = categories
      .map((category) => ({ id: category._id.toString(), name: category.name, revenue: round2(revenueByCategory.get(category._id.toString()) ?? 0) }))
      .sort((a, b) => b.revenue - a.revenue)

    const outOfStock = withStats.filter((product) => product.inventoryStatus === "out").sort((a, b) => a.name.localeCompare(b.name))
    const lowStock = withStats
      .filter((product) => product.inventoryStatus === "low")
      .sort((a, b) => a.availableStock - b.availableStock || a.name.localeCompare(b.name))
    const restockCandidates = withStats
      .filter((product) => product.soldLast30 > 0 && product.availableStock <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => b.soldLast30 - a.soldLast30 || a.availableStock - b.availableStock)
      .slice(0, RESTOCK_CANDIDATES)

    // ---- customers -----------------------------------------------------------
    const returning = repeatBuyers.length
      ? await User.countDocuments({ role: "customer", deletedAt: null, _id: { $in: repeatBuyers.map((entry) => entry._id) } })
      : 0
    const counted = orderTotals[0] ?? { count: 0, sum: 0 }

    // ---- recommendations (rules over the real figures above) ------------------
    const recommendations: AdminInsights["recommendations"] = []
    const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

    const restock = restockCandidates[0]
    if (restock) {
      recommendations.push({
        id: "restock",
        type: "restock",
        title: `Restock ${restock.name}`,
        description: `${plural(restock.soldLast30, "unit", "units")} sold in the last 30 days with only ${plural(restock.availableStock, "unit", "units")} left.`,
        priority: restock.availableStock <= LOW_STOCK_THRESHOLD ? "high" : "medium",
        product: ref(restock),
      })
    }

    // Only suggest a promotion once the store has real sales activity to compare against.
    const slowMover = sum(salesLast30) > 0
      ? withStats
          .filter((product) => product.soldLast30 === 0 && product.availableStock > LOW_STOCK_THRESHOLD)
          .sort((a, b) => b.availableStock - a.availableStock || a.name.localeCompare(b.name))[0]
      : undefined
    if (slowMover) {
      recommendations.push({
        id: "promote",
        type: "promote",
        title: `Promote ${slowMover.name}`,
        description: `${plural(slowMover.availableStock, "unit", "units")} in stock and no sales in the last 30 days — a feature spot or discount could move inventory.`,
        priority: "medium",
        product: ref(slowMover),
      })
    }

    const topCategory = rankedCategories[0]
    const bundlePair = topCategory
      ? withStats
          .filter((product) => product.soldCount > 0 && product.categoryId.toString() === topCategory.id)
          .sort((a, b) => b.soldCount - a.soldCount)
          .slice(0, 2)
      : []
    if (topCategory && bundlePair.length === 2) {
      recommendations.push({
        id: "bundle",
        type: "bundle",
        title: `Bundle ${bundlePair[0].name} with ${bundlePair[1].name}`,
        description: `Both are best sellers in ${topCategory.name}, your top category by revenue — a bundle could raise average order value.`,
        priority: "low",
        product: ref(bundlePair[0]),
      })
    }

    const highlight = withStats
      .filter((product) => product.rating >= HIGHLIGHT_MIN_RATING && product.reviewCount > 0)
      .sort((a, b) => b.reviewCount - a.reviewCount || b.rating - a.rating)[0]
    if (highlight) {
      recommendations.push({
        id: "highlight",
        type: "highlight",
        title: `Highlight ${highlight.name}`,
        description: `Rated ${highlight.rating.toFixed(1)}★ across ${plural(highlight.reviewCount, "review", "reviews")} — a strong candidate for the homepage or an email spotlight.`,
        priority: "low",
        product: ref(highlight),
      })
    }

    const body: AdminInsights = {
      generatedAt: now.toISOString(),
      sales: {
        period,
        series,
        total: periodTotal,
        halfOverHalfPercent: percentChange(secondHalf, firstHalf),
        bestPoint: bestPoint && bestPoint.value > 0 ? bestPoint : null,
        topCategories: rankedCategories.slice(0, 2),
      },
      summary: {
        revenueTrendPercent: percentChange(sum(salesLast30), sum(salesPrev30)),
        bestProduct: topPerforming[0] ?? null,
        lowStockRisk: outOfStock.length + lowStock.length,
        newCustomers: customersNew,
      },
      products: { topPerforming, needsAttention, topCategories: rankedCategories.slice(0, TOP_CATEGORIES) },
      inventory: {
        threshold: LOW_STOCK_THRESHOLD,
        outOfStock: outOfStock.map((product) => ({ ...ref(product), stock: product.availableStock })),
        lowStock: lowStock.map((product) => ({ ...ref(product), stock: product.availableStock })),
        restockCandidates: restockCandidates.map((product) => ({ ...ref(product), stock: product.availableStock, soldLast30Days: product.soldLast30 })),
      },
      customers: {
        total: customersTotal,
        newLast30Days: customersNew,
        returning,
        returningRate: customersTotal > 0 ? round1((returning / customersTotal) * 100) : 0,
        averageOrderValue: counted.count > 0 ? round2(counted.sum / counted.count) : null,
      },
      recommendations,
    }

    return ok(body)
  } catch (error) {
    return serverError("GET /api/admin/insights failed:", error)
  }
}
