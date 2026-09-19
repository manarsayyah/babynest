import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice } from "@/components/product/product-card"
import { orderStatusLabel, type Order, type OrderStatus } from "@/lib/api-client/orders"

const statusVariant: Record<OrderStatus, "success" | "warning" | "ai" | "outline" | "destructive"> = {
  delivered: "success",
  processing: "warning",
  shipped: "ai",
  pending: "outline",
  cancelled: "destructive",
}

const itemCount = (order: Order) => order.items.reduce((sum, item) => sum + item.quantity, 0)

/** "Recent Orders" table (the customer's own latest orders) with a link out to the full Orders page. */
function RecentOrdersCard({ orders, status }: { orders: Order[] | null; status: "loading" | "error" | "ready" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-small">
            <thead>
              <tr className="border-b border-border text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-2 text-left">Order ID</th>
                <th className="px-2 py-2 text-left">Date</th>
                <th className="px-2 py-2 text-left">Items</th>
                <th className="px-2 py-2 text-left">Total</th>
                <th className="px-2 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-3 font-medium text-foreground">{order.id}</td>
                  <td className="px-2 py-3 text-muted-foreground">{order.date}</td>
                  <td className="px-2 py-3 text-muted-foreground">{itemCount(order)} {itemCount(order) === 1 ? "item" : "items"}</td>
                  <td className="px-2 py-3 font-medium text-foreground">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={statusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {status === "loading" ? (
            <div className="flex flex-col gap-2 pt-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : status === "error" ? (
            <p className="px-2 py-4 text-small text-muted-foreground">Couldn&apos;t load your orders right now.</p>
          ) : orders && orders.length === 0 ? (
            <p className="px-2 py-4 text-small text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          ) : null}
        </div>
        <Link
          href="/account/orders"
          className="text-center text-small font-medium text-primary underline-offset-2 hover:underline"
        >
          View All Orders
        </Link>
      </CardContent>
    </Card>
  )
}

export { RecentOrdersCard }
