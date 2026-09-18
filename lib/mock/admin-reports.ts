import { topProductsPreview, type SalesPoint } from "@/lib/mock/admin-dashboard"
import { orderStatusSequence, type AdminOrder, type AdminOrderStatus } from "@/lib/mock/admin-orders"
import {
  LOW_STOCK_THRESHOLD,
  adminProductCategoryOptions,
  adminProducts,
  type AdminProduct,
} from "@/lib/mock/admin-products"
import { adminCustomers, isReturningCustomer } from "@/lib/mock/admin-customers"

/**
 * Report aggregation layer. Everything here reads the same admin data
 * sources already used across the Admin (`admin-orders`, `admin-products`,
 * `admin-customers`, `shop-catalog`) and computes real, date-filtered
 * figures from them — no separate backend, no duplicated data, and no
 * dependency on the AI Insights page's own derived module, so this stays a
 * one-file swap once a real reporting API exists.
 */
export type ReportDateRangeKey = "today" | "7d" | "30d" | "3m" | "year" | "custom"

export const reportDateRangeOptions: { value: ReportDateRangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "3m", label: "Last 3 Months" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
]

export type ReportType = "all" | "sales" | "orders" | "products" | "customers" | "inventory"

export const reportTypeOptions: { value: ReportType; label: string }[] = [
  { value: "all", label: "All Reports" },
  { value: "sales", label: "Sales" },
  { value: "orders", label: "Orders" },
  { value: "products", label: "Products" },
  { value: "customers", label: "Customers" },
  { value: "inventory", label: "Inventory" },
]

export const reportCategoryOptions = adminProductCategoryOptions

export type DateRange = { start: Date; end: Date }

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

/** Resolves a filter key (and optional custom bounds) into an absolute [start, end] window. */
export function resolveDateRange(key: ReportDateRangeKey, custom?: { start: string; end: string }): DateRange {
  const now = new Date()

  switch (key) {
    case "today":
      return { start: startOfDay(now), end: now }
    case "7d": {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return { start, end: now }
    }
    case "3m": {
      const start = new Date(now)
      start.setMonth(start.getMonth() - 3)
      return { start, end: now }
    }
    case "year":
      return { start: new Date(now.getFullYear(), 0, 1), end: now }
    case "custom": {
      if (custom?.start && custom?.end) {
        const start = startOfDay(new Date(custom.start))
        const end = new Date(custom.end)
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
          return { start, end }
        }
      }
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return { start, end: now }
    }
    case "30d":
    default: {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return { start, end: now }
    }
  }
}

/** Same-length window immediately before `range`, for period-over-period comparison. */
export function getPreviousRange(range: DateRange): DateRange {
  const durationMs = range.end.getTime() - range.start.getTime()
  return { start: new Date(range.start.getTime() - durationMs), end: new Date(range.start) }
}

export function filterOrdersByRange(orders: AdminOrder[], range: DateRange) {
  return orders.filter((order) => {
    const date = new Date(order.date)
    return date >= range.start && date <= range.end
  })
}

export type ReportMetrics = {
  revenue: number
  orderCount: number
  averageOrderValue: number
  uniqueCustomers: number
}

export function computeReportMetrics(orders: AdminOrder[]): ReportMetrics {
  const revenue = orders.reduce((sum, o) => sum + o.total, 0)
  const orderCount = orders.length
  const averageOrderValue = orderCount > 0 ? revenue / orderCount : 0
  const uniqueCustomers = new Set(orders.map((o) => o.customerEmail)).size
  return { revenue, orderCount, averageOrderValue, uniqueCustomers }
}

/** Percent change vs. a prior value, or `null` when there's no prior-period data to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}

/** Buckets orders into a `SalesChart`-ready series — daily/weekly/monthly depending on the range's span. */
export function buildSalesSeries(orders: AdminOrder[], range: DateRange): SalesPoint[] {
  const spanDays = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / 86400000))

  if (spanDays <= 1) {
    return [{ label: "Today", value: orders.reduce((sum, o) => sum + o.total, 0) }]
  }

  if (spanDays <= 14) {
    return Array.from({ length: spanDays }, (_, i) => {
      const day = new Date(range.start)
      day.setDate(day.getDate() + i)
      const value = orders
        .filter((o) => isSameDay(new Date(o.date), day))
        .reduce((sum, o) => sum + o.total, 0)
      return { label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value }
    })
  }

  if (spanDays <= 120) {
    const weeks = Math.ceil(spanDays / 7)
    return Array.from({ length: weeks }, (_, i) => {
      const weekStart = new Date(range.start)
      weekStart.setDate(weekStart.getDate() + i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const value = orders
        .filter((o) => {
          const d = new Date(o.date)
          return d >= weekStart && d < weekEnd
        })
        .reduce((sum, o) => sum + o.total, 0)
      return { label: `Week ${i + 1}`, value }
    })
  }

  const points: SalesPoint[] = []
  const cursor = new Date(range.start.getFullYear(), range.start.getMonth(), 1)
  while (cursor <= range.end) {
    const monthStart = new Date(cursor)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const value = orders
      .filter((o) => {
        const d = new Date(o.date)
        return d >= monthStart && d < monthEnd
      })
      .reduce((sum, o) => sum + o.total, 0)
    points.push({ label: monthStart.toLocaleDateString("en-US", { month: "short" }), value })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return points
}

export function getOrderStatusBreakdown(orders: AdminOrder[]): Record<AdminOrderStatus, number> {
  const breakdown = Object.fromEntries(orderStatusSequence.map((status) => [status, 0])) as Record<
    AdminOrderStatus,
    number
  >
  orders.forEach((order) => {
    breakdown[order.status] += 1
  })
  return breakdown
}

export type ReportProductPerformance = { product: AdminProduct; revenue: number; unitsSold: number }

/** Top sellers from the Dashboard's own revenue figures, optionally narrowed to one category. */
export function getTopPerformingProducts(categorySlug: string | null, limit = 5): ReportProductPerformance[] {
  return topProductsPreview
    .map((entry) => {
      const product = adminProducts.find((p) => p.slug === entry.slug)
      if (!product) return null
      if (categorySlug && product.category !== categorySlug) return null
      return { product, revenue: entry.revenue, unitsSold: entry.soldCount }
    })
    .filter((entry): entry is ReportProductPerformance => entry !== null)
    .slice(0, limit)
}

/** Lower-rated active listings, standing in for "lowest performing" until real per-product sales history exists. */
export function getLowestPerformingProducts(categorySlug: string | null, limit = 5): AdminProduct[] {
  return adminProducts
    .filter((p) => p.status === "active" && (!categorySlug || p.category === categorySlug))
    .sort((a, b) => a.rating - b.rating || a.reviewCount - b.reviewCount)
    .slice(0, limit)
}

export function getInventoryOverview(categorySlug: string | null) {
  const scoped = categorySlug ? adminProducts.filter((p) => p.category === categorySlug) : adminProducts
  const outOfStock = scoped.filter((p) => p.status === "out-of-stock")
  const lowStock = scoped.filter((p) => p.status !== "out-of-stock" && p.stock <= LOW_STOCK_THRESHOLD)
  const inventoryValue = scoped.reduce((sum, p) => sum + p.stock * p.price, 0)
  return { total: scoped.length, outOfStock, lowStock, inventoryValue }
}

export type CustomerReport = {
  newCustomers: number
  returningCustomers: number
  totalCustomers: number
  averageCustomerSpend: number
}

export function getCustomerReport(range: DateRange): CustomerReport {
  const newCustomers = adminCustomers.filter((c) => {
    const joined = new Date(c.joinedDate)
    return joined >= range.start && joined <= range.end
  }).length
  const returningCustomers = adminCustomers.filter(isReturningCustomer).length
  const totalCustomers = adminCustomers.length
  const averageCustomerSpend =
    totalCustomers > 0 ? adminCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0

  return { newCustomers, returningCustomers, totalCustomers, averageCustomerSpend }
}
