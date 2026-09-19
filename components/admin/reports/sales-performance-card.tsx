import { TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { SalesChart } from "@/components/admin/sales-chart"
import { formatPrice } from "@/lib/format"
import type { ReportSalesPoint } from "@/lib/api-client/admin-reports"

export type SalesPerformanceCardProps = {
  data: ReportSalesPoint[]
  revenue: number
  changePercent: number | null
}

/** "Sales Performance" — reuses the existing chart primitive over the currently-filtered order data. */
function SalesPerformanceCard({ data, revenue, changePercent }: SalesPerformanceCardProps) {
  const hasData = data.some((point) => point.value > 0)
  const trendUp = changePercent !== null && changePercent >= 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Sales Performance</CardTitle>
        <p className="text-caption text-muted-foreground">Revenue over the selected period</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {hasData ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-h2 text-foreground">{formatPrice(revenue)}</span>
              <span
                className={cn(
                  "flex items-center gap-1 text-small font-medium",
                  changePercent === null ? "text-muted-foreground" : trendUp ? "text-success" : "text-destructive"
                )}
              >
                {changePercent === null ? (
                  "No prior period to compare"
                ) : (
                  <>
                    {trendUp ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {trendUp ? "+" : ""}
                    {changePercent.toFixed(1)}% vs. previous period
                  </>
                )}
              </span>
            </div>
            <SalesChart data={data} />
          </>
        ) : (
          <EmptyState
            title="No report data available"
            description="Once your store has enough data, reports will appear here."
          />
        )}
      </CardContent>
    </Card>
  )
}

export { SalesPerformanceCard }
