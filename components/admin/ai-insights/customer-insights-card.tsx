import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import { getCustomerInsights } from "@/lib/mock/admin-ai-insights"

/** "Customer Insights" — growth, retention, and spend signals derived from the admin customer/order lists. */
function CustomerInsightsCard() {
  const { total, newCustomers, returningRate, averageOrderValue } = getCustomerInsights()

  const rows = [
    { label: "New Customer Growth", value: newCustomers.toLocaleString("en-US"), note: "Joined in the last 30 days" },
    { label: "Returning Customer Rate", value: `${returningRate.toFixed(0)}%`, note: "Placed 2+ orders" },
    { label: "Average Order Value", value: formatPrice(averageOrderValue), note: "Across all orders" },
  ]

  const interpretation =
    total > 0
      ? `${returningRate.toFixed(0)}% of your customers are repeat shoppers, and ${newCustomers} joined in the last 30 days — retention is a bigger driver of revenue here than acquisition alone.`
      : "Not enough customer data yet to generate a trend summary."

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
