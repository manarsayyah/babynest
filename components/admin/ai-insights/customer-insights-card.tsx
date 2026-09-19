import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import type { AdminInsights } from "@/lib/api-client/admin-insights"

export type CustomerInsightsCardProps = {
  customers: AdminInsights["customers"] | null
}

/** "Customer Insights" — growth, retention, and spend calculated from real customers and their (non-cancelled) orders. */
function CustomerInsightsCard({ customers }: CustomerInsightsCardProps) {
  const rows = [
    {
      label: "New Customer Growth",
      value: customers ? customers.newLast30Days.toLocaleString("en-US") : "—",
      note: "Joined in the last 30 days",
    },
    {
      label: "Returning Customer Rate",
      value: customers ? `${customers.returningRate.toFixed(0)}%` : "—",
      note: "Placed 2+ orders",
    },
    {
      label: "Average Order Value",
      value: customers && customers.averageOrderValue !== null ? formatPrice(customers.averageOrderValue) : "—",
      note: customers && customers.averageOrderValue === null ? "No orders yet" : "Across non-cancelled orders",
    },
  ]

  const interpretation =
    customers && customers.total > 0
      ? `${customers.returningRate.toFixed(0)}% of your customers are repeat shoppers, and ${customers.newLast30Days} joined in the last 30 days.`
      : "Not enough customer data yet to generate a summary."

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Customer Insights</CardTitle>
        <p className="text-caption text-muted-foreground">Growth, retention, and spend</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-muted/50 p-3">
              <p className="text-h3 text-foreground">{row.value}</p>
              <p className="mt-0.5 text-small font-medium text-foreground">{row.label}</p>
              <p className="text-caption text-muted-foreground">{row.note}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-ai-border bg-ai-muted/50 p-3">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
          <p className="text-small text-foreground">{interpretation}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { CustomerInsightsCard }
