import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import type { CustomerReport } from "@/lib/mock/admin-reports"

export type CustomerPerformanceCardProps = {
  report: CustomerReport
}

/** "Customer Performance" — new/returning counts, average spend, and a short growth read. */
function CustomerPerformanceCard({ report }: CustomerPerformanceCardProps) {
  const { newCustomers, returningCustomers, totalCustomers, averageCustomerSpend } = report
  const returningRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0

  const rows = [
    { label: "New Customers", value: newCustomers.toLocaleString("en-US"), note: "Joined in this period" },
    { label: "Returning Customers", value: returningCustomers.toLocaleString("en-US"), note: `${returningRate.toFixed(0)}% of all customers` },
    { label: "Average Customer Spend", value: formatPrice(averageCustomerSpend), note: "Lifetime, across all customers" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Customer Performance</CardTitle>
        <p className="text-caption text-muted-foreground">Growth, retention, and spend</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-muted/50 p-3">
              <p className="text-h3 text-foreground">{row.value}</p>
              <p className="mt-0.5 text-small font-medium text-foreground">{row.label}</p>
              <p className="text-caption text-muted-foreground">{row.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { CustomerPerformanceCard }
