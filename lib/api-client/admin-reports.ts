import { apiFetch } from "@/lib/api-client/fetcher"

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

export type ReportOrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export const reportOrderStatusLabel: Record<ReportOrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export type ReportSalesPoint = { label: string; value: number }
type ReportProductRef = { id: string; name: string; slug: string; image: string | null }

export type ReportMetrics = {
  revenue: number
  orderCount: number
  averageOrderValue: number
  uniqueCustomers: number
}

/**
 * GET /api/admin/reports — every figure is aggregated server-side from MongoDB (admin only).
 *
 * Definitions (the Dashboard's): "revenue" = the `total` of live (not deleted) orders that are not cancelled —
 * Cash on Delivery orders count while their payment is still pending. "Orders" = every live order in the period
 * (all statuses), like the Dashboard's order count. Average order value and unique customers use the counted
 * (non-cancelled) orders. All dates are UTC.
 */
export type AdminReport = {
  generatedAt: string
  range: {
    key: ReportDateRangeKey
    /** Inclusive start of the period (UTC). */
    start: string
    /** Exclusive end of the period (UTC). */
    end: string
    previousStart: string
  }
  metrics: ReportMetrics
  /** % change vs the previous period of the same length; null when the previous period has nothing to compare. */
  changes: { revenue: number | null; orderCount: number | null; averageOrderValue: number | null; uniqueCustomers: number | null }
  salesSeries: ReportSalesPoint[]
  orderStatus: Record<ReportOrderStatus, number>
  totalOrders: number
  products: {
    topSelling: (ReportProductRef & { revenue: number; unitsSold: number })[]
    lowestRated: (ReportProductRef & { rating: number; reviewCount: number })[]
  }
  customers: {
    newCustomers: number
    returningCustomers: number
    totalCustomers: number
    averageCustomerSpend: number
  }
  inventory: {
    threshold: number
    total: number
    outOfStock: { id: string; name: string }[]
    lowStock: { id: string; name: string }[]
    inventoryValue: number
  }
  categoryOptions: { _id: string; name: string; parentCategoryId: string | null }[]
}

export type AdminReportQuery = {
  range: ReportDateRangeKey
  /** YYYY-MM-DD — only for range "custom". */
  start?: string
  end?: string
  categoryId?: string
}

export function fetchAdminReport(query: AdminReportQuery, init?: RequestInit): Promise<AdminReport> {
  const params = new URLSearchParams({ range: query.range })
  if (query.range === "custom") {
    if (query.start) params.set("start", query.start)
    if (query.end) params.set("end", query.end)
  }
  if (query.categoryId) params.set("categoryId", query.categoryId)
  return apiFetch<AdminReport>(`/api/admin/reports?${params.toString()}`, { cache: "no-store", ...init })
}
