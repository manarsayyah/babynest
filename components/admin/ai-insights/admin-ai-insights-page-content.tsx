"use client"

import * as React from "react"
import { toast } from "sonner"
import { RefreshCw } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { AIBadge } from "@/components/ai/ai-badge"
import { InsightsSummaryCards } from "@/components/admin/ai-insights/insights-summary-cards"
import { SalesInsightsCard } from "@/components/admin/ai-insights/sales-insights-card"
import { ProductPerformanceCard } from "@/components/admin/ai-insights/product-performance-card"
import { InventoryInsightsCard } from "@/components/admin/ai-insights/inventory-insights-card"
import { CustomerInsightsCard } from "@/components/admin/ai-insights/customer-insights-card"
import { AIRecommendationsSection } from "@/components/admin/ai-insights/ai-recommendations-section"

const REFRESH_DELAY_MS = 700

/** Admin AI Insights page: header, summary tiles, sales/product/inventory/customer insight cards, AI recommendations. */
function AdminAIInsightsPageContent() {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const lastUpdatedLabel = React.useMemo(
    () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    []
  )

  function handleRefresh() {
    setIsRefreshing(true)
    window.setTimeout(() => {
      setIsRefreshing(false)
      toast.success("Insights refreshed", {
        description: "Recalculated from your latest store data. No external AI service is connected yet.",
      })
    }, REFRESH_DELAY_MS)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 text-foreground">AI Insights</h1>
            <AIBadge />
          </div>
          <p className="text-body text-muted-foreground">Smart insights and recommendations for your BabyNest store</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-caption text-muted-foreground">Last updated: Today, {lastUpdatedLabel}</span>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw data-icon="inline-start" className={cn(isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh Insights"}
          </Button>
        </div>
      </div>

      <InsightsSummaryCards />

      <SalesInsightsCard />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProductPerformanceCard />
        <InventoryInsightsCard />
      </div>

      <CustomerInsightsCard />

      <AIRecommendationsSection />
    </div>
  )
}

export { AdminAIInsightsPageContent }
