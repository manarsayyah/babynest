import type { ElementType } from "react"
import { ArrowDownRight, ArrowUpRight, DollarSign, Minus, ShoppingBag, Users } from "lucide-react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import type { ReportMetrics } from "@/lib/mock/admin-reports"

const toneClasses = {
  primary: "bg-accent text-primary",
  ai: "bg-ai-muted text-ai",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning-foreground",
} as const

type MetricCardProps = {
  icon: ElementType
  label: string
  value: string
  changePercent: number | null
}

function MetricCard({ icon: Icon, label, value, changePercent, tone }: MetricCardProps & { tone: keyof typeof toneClasses }) {
  const trendUp = changePercent !== null && changePercent >= 0

  return (
    <Card className="flex-row items-center gap-3 p-3.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-lg leading-tight font-bold text-foreground">{value}</span>
        <span className="truncate text-caption font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "flex items-center gap-1 truncate text-caption",
            changePercent === null ? "text-muted-foreground/80" : trendUp ? "text-success" : "text-destructive"
          )}
        >
          {changePercent === null ? (
            <>
              <Minus className="size-3 shrink-0" />
              No prior period data
            </>
          ) : (
            <>
              {trendUp ? <ArrowUpRight className="size-3 shrink-0" /> : <ArrowDownRight className="size-3 shrink-0" />}
              {trendUp ? "+" : ""}
              {changePercent.toFixed(1)}% vs. previous period
            </>
          )}
        </span>
      </div>
    </Card>
  )
}

export type ReportKeyMetricsProps = {
  metrics: ReportMetrics
  changes: {
    revenue: number | null
    orderCount: number | null
    averageOrderValue: number | null
    uniqueCustomers: number | null
  }
}

/** Revenue / Orders / Average Order Value / Customers — compact, filter-driven KPI row. */
function ReportKeyMetrics({ metrics, changes }: ReportKeyMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        icon={DollarSign}
        label="Revenue"
        value={formatPrice(metrics.revenue)}
        changePercent={changes.revenue}
        tone="primary"
      />
      <MetricCard
        icon={ShoppingBag}
        label="Orders"
        value={metrics.orderCount.toLocaleString("en-US")}
        changePercent={changes.orderCount}
        tone="ai"
      />
      <MetricCard
        icon={DollarSign}
        label="Average Order Value"
        value={formatPrice(metrics.averageOrderValue)}
        changePercent={changes.averageOrderValue}
        tone="success"
      />
      <MetricCard
        icon={Users}
        label="Customers"
        value={metrics.uniqueCustomers.toLocaleString("en-US")}
        changePercent={changes.uniqueCustomers}
        tone="warning"
      />
    </div>
  )
}

export { ReportKeyMetrics }
