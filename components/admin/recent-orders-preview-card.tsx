import Link from "next/link"
import { Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/format"
import { orderStatusLabel, type OrderStatus } from "@/lib/api-client/orders"
import type { AdminDashboardData } from "@/lib/api-client/admin-dashboard"

const statusVariant: Record<OrderStatus, "success" | "warning" | "ai" | "destructive"> = {
  delivered: "success",
  pending: "warning",
  processing: "warning",
  shipped: "ai",
  cancelled: "destructive",
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })

/** "Recent Orders" — store-wide, across many customers (unlike the customer-facing single-shopper history). */
function RecentOrdersPreviewCard({ orders }: { orders: AdminDashboardData["recentOrders"] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-h3">Recent Orders</CardTitle>
        <Link href="/admin/orders" className="text-small font-medium text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-small">
            <thead>
              <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-2 py-2 text-left whitespace-nowrap">Order ID</th>
                <th className="px-2 py-2 text-left">Customer</th>
                <th className="px-2 py-2 text-left">Product</th>
                <th className="px-2 py-2 text-left">Amount</th>
                <th className="px-2 py-2 text-left">Status</th>
                <th className="px-2 py-2 text-left">Date</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-6 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              ) : null}
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-3 font-medium whitespace-nowrap text-foreground">{order.orderNumber}</td>
                  <td className="px-2 py-3 text-foreground">{order.customer}</td>
                  <td className="max-w-36 truncate px-2 py-3 text-muted-foreground">{order.product}</td>
                  <td className="px-2 py-3 font-medium text-foreground">{formatPrice(order.amount)}</td>
                  <td className="px-2 py-3">
                    <Badge variant={statusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                  </td>
                  <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{shortDate(order.createdAt)}</td>
                  <td className="px-2 py-3 text-right">
                    <Link
                      href="/admin/orders"
                      aria-label={`View order ${order.orderNumber}`}
                      className="inline-flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Eye className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export { RecentOrdersPreviewCard }
