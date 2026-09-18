import { mockCategories } from "@/lib/mock/categories"
import { shopCatalog } from "@/lib/mock/shop-catalog"
import { salesSeries, topProductsPreview, type SalesPeriod, type SalesPoint } from "@/lib/mock/admin-dashboard"
import { LOW_STOCK_THRESHOLD, adminProducts, type AdminProduct } from "@/lib/mock/admin-products"
import { adminOrders } from "@/lib/mock/admin-orders"
import { adminCustomers, isNewCustomer, isReturningCustomer } from "@/lib/mock/admin-customers"

/**
 * Derived "AI Insights" layer for the admin analytics page. Nothing here is
 * a real AI/ML call — every value is computed from the same mock data the
 * rest of the Admin already uses (`admin-dashboard`, `admin-products`,
 * `admin-orders`, `admin-customers`, `shop-catalog`), so this is a one-file
 * swap once a real analytics/AI API exists. No data is duplicated: this
 * file only reads and summarizes the existing sources.
 */
export type PriorityLevel = "high" | "medium" | "low"

const categoryLabelBySlug = new Map(mockCategories.map((c) => [c.slug, c.name]))

function categoryLabel(slug: string) {
  return categoryLabelBySlug.get(slug) ?? slug
}

/** Compares the first half of a period's series against the second half — a simple, honest trend proxy. */
function splitTrend(data: SalesPoint[]) {
  const mid = Math.ceil(data.length / 2)
  const firstHalf = data.slice(0, mid).reduce((sum, p) => sum + p.value, 0)
  const secondHalf = data.slice(mid).reduce((sum, p) => sum + p.value, 0)
  const changePercent = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0
  const best = data.reduce((max, p) => (p.value > max.value ? p : max), data[0])
  return { firstHalf, secondHalf, changePercent, bestPoint: best }
}

export function getRevenueTrend(period: SalesPeriod = "30d") {
  const data = salesSeries[period]
  return { data, ...splitTrend(data) }
}

/** Best-selling categories, ranked by revenue from the Dashboard's own "Top Products" figures. */
export function getTopCategoriesByRevenue(limit = 3) {
  const revenueBySlug = new Map<string, number>()
  for (const entry of topProductsPreview) {
    const product = shopCatalog.find((p) => p.slug === entry.slug)
    if (!product) continue
    revenueBySlug.set(product.category, (revenueBySlug.get(product.category) ?? 0) + entry.revenue)
  }
  return Array.from(revenueBySlug.entries())
    .map(([slug, revenue]) => ({ slug, name: categoryLabel(slug), revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

export function getBestPerformingProduct() {
  const top = topProductsPreview[0]
  if (!top) return null
  const product = shopCatalog.find((p) => p.slug === top.slug)
  if (!product) return null
  return { product, soldCount: top.soldCount, revenue: top.revenue }
}

export function getInventoryRiskCounts() {
  const outOfStock = adminProducts.filter((p) => p.status === "out-of-stock")
  const lowStock = adminProducts.filter((p) => p.status !== "out-of-stock" && p.stock <= LOW_STOCK_THRESHOLD)
  return { outOfStock, lowStock, total: outOfStock.length + lowStock.length }
}

/** Lower-rated active listings — a proxy for softening demand, not a real historical sales trend. */
export function getDecliningProducts(limit = 3): AdminProduct[] {
  return [...adminProducts]
    .filter((p) => p.status === "active")
    .sort((a, b) => a.rating - b.rating || a.reviewCount - b.reviewCount)
    .slice(0, limit)
}

/** Popular, well-reviewed products whose stock is thinning — good restock candidates. */
export function getVelocityRestockCandidates(limit = 2): AdminProduct[] {
  return [...adminProducts]
    .filter((p) => p.status !== "out-of-stock" && p.rating >= 4.7 && p.reviewCount >= 100)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, limit)
}

/** High stock, comparatively little engagement — candidates for a promotional push. */
export function getSlowMovingProducts(limit = 2): AdminProduct[] {
  return [...adminProducts]
    .filter((p) => p.status === "active")
    .sort((a, b) => b.stock - a.stock || a.reviewCount - b.reviewCount)
    .slice(0, limit)
}

export function getTopRatedProducts(limit = 2): AdminProduct[] {
  return [...adminProducts]
    .filter((p) => p.status === "active" && p.rating >= 4.8)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit)
}

export function getCustomerInsights() {
  const total = adminCustomers.length
  const newCustomers = adminCustomers.filter((c) => isNewCustomer(c)).length
  const returning = adminCustomers.filter(isReturningCustomer).length
  const returningRate = total > 0 ? (returning / total) * 100 : 0
  const averageOrderValue = adminOrders.length > 0
    ? adminOrders.reduce((sum, o) => sum + o.total, 0) / adminOrders.length
    : 0

  return { total, newCustomers, returning, returningRate, averageOrderValue }
}

export type AIRecommendationType = "restock" | "promote" | "bundle" | "highlight"

export type AIRecommendationInsight = {
  id: string
  type: AIRecommendationType
  title: string
  description: string
  priority: PriorityLevel
}

/** Assembles the "AI Recommendations" cards from the derived signals above — deterministic, not generative. */
export function getAIRecommendations(): AIRecommendationInsight[] {
  const recommendations: AIRecommendationInsight[] = []

  const restockCandidates = getVelocityRestockCandidates(1)
  if (restockCandidates.length > 0) {
    const product = restockCandidates[0]
    recommendations.push({
      id: "restock",
      type: "restock",
      title: `Restock ${product.name}`,
      description: `${product.reviewCount} reviews and a ${product.rating.toFixed(1)}★ rating with only ${product.stock} units left — demand is outpacing supply.`,
      priority: product.stock <= LOW_STOCK_THRESHOLD ? "high" : "medium",
    })
  }

  const slowMovers = getSlowMovingProducts(1)
  if (slowMovers.length > 0) {
    const product = slowMovers[0]
    recommendations.push({
      id: "promote",
      type: "promote",
      title: `Promote ${product.name}`,
      description: `${product.stock} units in stock with comparatively few reviews — a feature spot or discount could move inventory.`,
      priority: "medium",
    })
  }

  const topCategory = getTopCategoriesByRevenue(1)[0]
  const bundlePair = topCategory
    ? adminProducts.filter((p) => p.category === topCategory.slug && p.status === "active").slice(0, 2)
    : []
  if (bundlePair.length === 2) {
    recommendations.push({
      id: "bundle",
      type: "bundle",
      title: `Bundle ${bundlePair[0].name} with ${bundlePair[1].name}`,
      description: `Both are top sellers in ${topCategory?.name ?? "the same category"} — a bundle could raise average order value.`,
      priority: "low",
    })
  }

  const topRated = getTopRatedProducts(1)
  if (topRated.length > 0) {
    const product = topRated[0]
    recommendations.push({
      id: "highlight",
      type: "highlight",
      title: `Highlight ${product.name}`,
      description: `Rated ${product.rating.toFixed(1)}★ across ${product.reviewCount} reviews — a strong candidate for the homepage or email spotlight.`,
      priority: "low",
    })
  }

  return recommendations
}
