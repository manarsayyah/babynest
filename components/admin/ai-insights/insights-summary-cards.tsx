import { ArrowDownRight, ArrowUpRight, PackageX, TrendingUp, UserPlus } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import { formatPrice } from "@/lib/format"
import type { AdminInsights } from "@/lib/api-client/admin-insights"

export type InsightsSummaryCardsProps = {
  /** Null while loading — tiles show a dash rather than a fake zero. */
  summary: AdminInsights["summary"] | null
}

/** Revenue Trend / Best Product / Low Stock Risk / Customer Growth — compact row above the insight cards. */
function InsightsSummaryCards({ summary }: InsightsSummaryCardsProps) {
  const trend = summary?.revenueTrendPercent ?? null
  const trendUp = trend === null || trend >= 0
  const best = summary?.bestProduct ?? null

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={trendUp ? ArrowUpRight : ArrowDownRight}
        label="Revenue Trend"
        value={summary ? (trend === null ? "—" : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`) : "—"}
        note={summary && trend === null ? "No earlier sales to compare" : "Last 30 days vs. previous 30"}
        tone={trendUp ? "success" : "warning"}
      />
      <CompactStatCard
        icon={TrendingUp}
        label="Best Performing Product"
        value={best ? best.name : "—"}
        note={best ? `${formatPrice(best.revenue)} revenue` : "No sales yet"}
        tone="ai"
      />
      <CompactStatCard
        icon={PackageX}
        label="Low Stock Risk"
        value={summary ? summary.lowStockRisk.toLocaleString("en-US") : "—"}
        note="Products need attention"
        tone="warning"
      />
      <CompactStatCard
        icon={UserPlus}
        label="Customer Growth"
        value={summary ? summary.newCustomers.toLocaleString("en-US") : "—"}
        note="New in last 30 days"
        tone="primary"
      />
    </div>
  )
}

export { InsightsSummaryCards }
