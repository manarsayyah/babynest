import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/product/product-card"
import type { AccountOrder, OrderStatus } from "@/lib/mock/account"

const statusVariant: Record<OrderStatus, "success" | "warning" | "ai"> = {
  Delivered: "success",
  Processing: "warning",
  Shipped: "ai",
}

/** "Recent Orders" table with a link out to the future full Orders page. */
function RecentOrdersCard({ orders }: { orders: AccountOrder[] }) {
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
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-3 font-medium text-foreground">{order.id}</td>
                  <td className="px-2 py-3 text-muted-foreground">{order.date}</td>
                  <td className="px-2 py-3 text-muted-foreground">{order.itemsCount} items</td>
                  <td className="px-2 py-3 font-medium text-foreground">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-2 py-3">
                    <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
