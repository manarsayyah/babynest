import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { orderStatusLabel, type AdminOrderStatus } from "@/lib/mock/admin-orders"

const barColorByStatus: Record<AdminOrderStatus, string> = {
  pending: "bg-warning",
  processing: "bg-ai",
  shipped: "bg-primary",
  delivered: "bg-success",
  cancelled: "bg-destructive",
}

export type OrderOverviewCardProps = {
  breakdown: Record<AdminOrderStatus, number>
  totalOrders: number
}

/** "Order Overview" — total + a status breakdown, as simple proportional bars (no new chart dependency). */
function OrderOverviewCard({ breakdown, totalOrders }: OrderOverviewCardProps) {
  const statuses = Object.entries(breakdown) as [AdminOrderStatus, number][]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Order Overview</CardTitle>
        <p className="text-caption text-muted-foreground">{totalOrders.toLocaleString("en-US")} total orders in this period</p>
      </CardHeader>
      <CardContent>
        {totalOrders > 0 ? (
          <div className="flex flex-col gap-3">
            {statuses.map(([status, count]) => (
              <div key={status} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-small">
                  <span className="text-foreground">{status === "delivered" ? "Completed" : orderStatusLabel[status]}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${barColorByStatus[status]}`}
                    style={{ width: `${totalOrders > 0 ? Math.max(count > 0 ? 4 : 0, (count / totalOrders) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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

export { OrderOverviewCard }
