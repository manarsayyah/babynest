"use client"

import * as React from "react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SalesChart } from "@/components/admin/sales-chart"
import { salesPeriodOptions, type SalesPeriod, type SalesPoint } from "@/lib/mock/admin-dashboard"

/** "Sales Overview" — revenue area chart with a 7D/30D/3M/1Y period switcher, over real order revenue. */
function SalesOverviewCard({ series }: { series: Record<SalesPeriod, SalesPoint[]> }) {
  const [period, setPeriod] = React.useState<SalesPeriod>("30d")
  const data = series[period]
  const total = data.reduce((sum, point) => sum + point.value, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-h3">Sales Overview</CardTitle>
          <p className="mt-0.5 text-caption text-muted-foreground">Revenue over time</p>
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
      <CardContent>
        <p className="mb-4 text-h2 text-foreground">
          ${total.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </p>
        <SalesChart data={data} />
      </CardContent>
    </Card>
  )
}

export { SalesOverviewCard }
