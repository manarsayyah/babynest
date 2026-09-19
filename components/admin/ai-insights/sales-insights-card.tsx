"use client"

import { Sparkles } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { SalesChart } from "@/components/admin/sales-chart"
import { formatPrice } from "@/lib/format"
import { insightsPeriodOptions, type AdminInsights, type InsightsPeriod } from "@/lib/api-client/admin-insights"

export type SalesInsightsCardProps = {
  sales: AdminInsights["sales"] | null
  period: InsightsPeriod
  onPeriodChange: (period: InsightsPeriod) => void
  /** A new period is being loaded — the previous chart stays visible but dimmed. */
  isLoading: boolean
}

/** "Sales Insights" — reuses the Dashboard's own chart primitive, plus a short factual read of the trend. */
function SalesInsightsCard({ sales, period, onPeriodChange, isLoading }: SalesInsightsCardProps) {
  const periodLabel = insightsPeriodOptions.find((o) => o.value === period)?.label.toLowerCase() ?? "selected period"
  const change = sales?.halfOverHalfPercent ?? null
  const trendUp = change === null || change >= 0
  const topCategories = sales?.topCategories ?? []

  const interpretation = sales
    ? change === null
      ? `Sales totaled ${formatPrice(sales.total)} over the ${periodLabel}${
          topCategories.length > 0 ? `, led by ${topCategories.map((c) => c.name.toLowerCase()).join(" and ")}` : ""
        }.`
      : `Sales have ${trendUp ? "increased" : "softened"} over the ${periodLabel}${
          topCategories.length > 0
            ? `, with the strongest performance coming from ${topCategories.map((c) => c.name.toLowerCase()).join(" and ")}`
            : ""
        }.`
    : ""

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-h3">Sales Insights</CardTitle>
          <p className="mt-0.5 text-caption text-muted-foreground">Revenue trend and best-performing period</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-full bg-muted p-1">
          {insightsPeriodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPeriodChange(option.value)}
              aria-pressed={period === option.value}
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
      <CardContent className={cn("flex flex-col gap-4 transition-opacity", isLoading && "opacity-60")} aria-busy={isLoading}>
        {sales && sales.total > 0 ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-h2 text-foreground">{formatPrice(sales.total)}</span>
              {change === null ? (
                <span className="text-small font-medium text-muted-foreground">No earlier sales in this period to compare</span>
              ) : (
                <span className={cn("text-small font-medium", trendUp ? "text-success" : "text-destructive")}>
                  {trendUp ? "+" : ""}
                  {change.toFixed(1)}% vs. first half of period
                </span>
              )}
            </div>
            <SalesChart data={sales.series} />
            {sales.bestPoint ? (
              <p className="text-caption text-muted-foreground">
                Best-performing point: <span className="font-medium text-foreground">{sales.bestPoint.label}</span>{" "}
                ({formatPrice(sales.bestPoint.value)})
              </p>
            ) : null}
            <div className="flex items-start gap-2 rounded-xl border border-ai-border bg-ai-muted/50 p-3">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
              <p className="text-small text-foreground">{interpretation}</p>
            </div>
          </>
        ) : (
          <EmptyState
            title={sales ? "No sales in this period" : "No insights available yet"}
            description={
              sales
                ? "Orders that aren't cancelled will appear in this chart as they come in."
                : "Once your store has enough sales data, trends will appear here."
            }
          />
        )}
      </CardContent>
    </Card>
  )
}

export { SalesInsightsCard }
