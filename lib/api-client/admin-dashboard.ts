import { apiFetch } from "@/lib/api-client/fetcher"
import type { OrderStatus } from "@/lib/api-client/orders"

export type DashboardSalesPeriod = "7d" | "30d" | "3m" | "1y"

/** GET /api/admin/dashboard — every figure is aggregated server-side from MongoDB (admin only). */
export type AdminDashboardData = {
  stats: {
    /** Total of every non-cancelled order. */
    totalSales: number
    orders: number
    customers: number
    products: number
    /** % change of the last 30 days vs the 30 days before; null when there's no prior period to compare. */
    trends: { sales: number | null; orders: number | null; customers: number | null }
  }
  salesSeries: Record<DashboardSalesPeriod, { label: string; value: number }[]>
  recentOrders: {
    id: string
    orderNumber: string
    customer: string
    product: string
    amount: number
    status: OrderStatus
    createdAt: string
  }[]
  topProducts: {
    id: string
    name: string
    slug: string
    image: string | null
    category: string | null
    soldCount: number
    revenue: number
  }[]
  highlights: string[]
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return apiFetch<AdminDashboardData>("/api/admin/dashboard", { cache: "no-store" })
}
