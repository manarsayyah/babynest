import { apiFetch } from "@/lib/api-client/fetcher"

export type InsightsPeriod = "7d" | "30d" | "3m" | "1y"

export const insightsPeriodOptions: { value: InsightsPeriod; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "3m", label: "3 Months" },
  { value: "1y", label: "1 Year" },
]

export type InsightsPriority = "high" | "medium" | "low"
export type InsightsRecommendationType = "restock" | "promote" | "bundle" | "highlight"

export type InsightsSalesPoint = { label: string; value: number }

type InsightsProductRef = { id: string; name: string; slug: string }

/**
 * GET /api/admin/insights — every figure is calculated on the server from MongoDB (admin only).
 * "Sales" follows the Dashboard's rule: the total of live (not deleted) orders that are not cancelled.
 * The recommendations are deterministic rules over that real data — no AI model is called.
 */
export type AdminInsights = {
  generatedAt: string
  sales: {
    period: InsightsPeriod
    series: InsightsSalesPoint[]
    /** Sum of the series — the period's sales. */
    total: number
    /** Second half of the period vs the first half; null when the first half has no sales to compare against. */
    halfOverHalfPercent: number | null
    /** The bucket with the most sales; null when the whole period has none. */
    bestPoint: InsightsSalesPoint | null
    topCategories: { id: string; name: string; revenue: number }[]
  }
  summary: {
    /** Last 30 days vs the 30 days before (the Dashboard's trend); null when there is no earlier period to compare. */
    revenueTrendPercent: number | null
    bestProduct: (InsightsProductRef & { image: string | null; soldCount: number; revenue: number }) | null
    /** Out-of-stock + low-stock active products. */
    lowStockRisk: number
    newCustomers: number
  }
  products: {
    topPerforming: (InsightsProductRef & { image: string | null; soldCount: number; revenue: number })[]
    needsAttention: (InsightsProductRef & { image: string | null; rating: number; reviewCount: number })[]
    topCategories: { id: string; name: string; revenue: number }[]
  }
  inventory: {
    threshold: number
    outOfStock: (InsightsProductRef & { stock: number })[]
    lowStock: (InsightsProductRef & { stock: number })[]
    restockCandidates: (InsightsProductRef & { stock: number; soldLast30Days: number })[]
  }
  customers: {
    total: number
    newLast30Days: number
    returning: number
    /** Share of customers with 2+ orders, 0-100. */
    returningRate: number
    /** Sales / number of counted orders; null when there are no counted orders yet. */
    averageOrderValue: number | null
  }
  recommendations: {
    id: string
    type: InsightsRecommendationType
    title: string
    description: string
    priority: InsightsPriority
    product: InsightsProductRef | null
  }[]
}

export function fetchAdminInsights(period: InsightsPeriod, init?: RequestInit): Promise<AdminInsights> {
  return apiFetch<AdminInsights>(`/api/admin/insights?period=${period}`, { cache: "no-store", ...init })
}
