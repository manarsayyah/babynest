import { ArrowDownRight, ArrowUpRight, PackageX, TrendingUp, UserPlus } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import { formatPrice } from "@/lib/format"
import {
  getBestPerformingProduct,
  getCustomerInsights,
  getInventoryRiskCounts,
  getRevenueTrend,
} from "@/lib/mock/admin-ai-insights"

/** Revenue Trend / Best Product / Low Stock Risk / Customer Growth — compact row above the insight cards. */
function InsightsSummaryCards() {
  const revenueTrend = getRevenueTrend()
  const bestProduct = getBestPerformingProduct()
  const risk = getInventoryRiskCounts()
  const customers = getCustomerInsights()
  const trendUp = revenueTrend.changePercent >= 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={trendUp ? ArrowUpRight : ArrowDownRight}
        label="Revenue Trend"
        value={`${trendUp ? "+" : ""}${revenueTrend.changePercent.toFixed(1)}%`}
        note="Last 30 days"
        tone={trendUp ? "success" : "warning"}
      />
      <CompactStatCard
        icon={TrendingUp}
        label="Best Performing Product"
        value={bestProduct ? bestProduct.product.name : "—"}
        note={bestProduct ? `${formatPrice(bestProduct.revenue)} revenue` : "No data yet"}
        tone="ai"
      />
      <CompactStatCard
        icon={PackageX}
        label="Low Stock Risk"
        value={risk.total.toLocaleString("en-US")}
        note="Products need attention"
        tone="warning"
      />
      <CompactStatCard
        icon={UserPlus}
        label="Customer Growth"
        value={customers.newCustomers.toLocaleString("en-US")}
        note="New in last 30 days"
        tone="primary"
      />
    </div>
  )
}

export { InsightsSummaryCards }
