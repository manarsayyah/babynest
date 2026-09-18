"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { SalesChart } from "@/components/admin/sales-chart"
import { formatPrice } from "@/lib/format"
import { salesPeriodOptions, type SalesPeriod } from "@/lib/mock/admin-dashboard"
import { getRevenueTrend, getTopCategoriesByRevenue } from "@/lib/mock/admin-ai-insights"

/** "Sales Insights" — reuses the Dashboard's own chart primitive, plus a short AI-style read of the trend. */
function SalesInsightsCard() {
  const [period, setPeriod] = React.useState<SalesPeriod>("30d")
  const trend = getRevenueTrend(period)
  const topCategories = getTopCategoriesByRevenue(2)
  const trendUp = trend.changePercent >= 0

  const interpretation =
    topCategories.length > 0
      ? `Sales have ${trendUp ? "increased" : "softened"} over the ${
          salesPeriodOptions.find((o) => o.value === period)?.label.toLowerCase() ?? "selected period"
        }, with the strongest performance coming from ${topCategories.map((c) => c.name.toLowerCase()).join(" and ")}.`
      : "Not enough sales data yet to generate a trend summary."

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-h3">Sales Insights</CardTitle>
          <p className="mt-0.5 text-caption text-muted-foreground">Revenue trend and best-performing period</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-full bg-muted p-1">
          {salesPeriodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-caption font-medium transition-colors",
                period === option.value
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {trend.data.length > 0 ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-h2 text-foreground">
                {formatPrice(trend.firstHalf + trend.secondHalf)}
              </span>
              <span className={cn("text-small font-medium", trendUp ? "text-success" : "text-destructive")}>
                {trendUp ? "+" : ""}
                {trend.changePercent.toFixed(1)}% vs. first half of period
              </span>
            </div>
            <SalesChart data={trend.data} />
            <p className="text-caption text-muted-foreground">
              Best-performing point: <span className="font-medium text-foreground">{trend.bestPoint.label}</span>{" "}
              ({formatPrice(trend.bestPoint.value)})
            </p>
            <div className="flex items-start gap-2 rounded-xl border border-ai-border bg-ai-muted/50 p-3">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
              <p className="text-small text-foreground">{interpretation}</p>
            </div>
          </>
        ) : (
          <EmptyState title="No insights available yet" description="Once your store has enough sales data, trends will appear here." />
        )}
      </CardContent>
    </Card>
  )
}

export { SalesInsightsCard }
