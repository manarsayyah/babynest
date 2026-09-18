"use client"

import { Ban, Eye, MoreVertical, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPrice } from "@/lib/format"
import {
  formatOrderDate,
  isOrderCancellable,
  orderStatusLabel,
  orderStatusSequence,
  paymentStatusLabel,
  type AdminOrderRow,
  type AdminOrderStatus,
  type AdminPaymentStatus,
} from "@/lib/api-client/admin-orders"

const statusBadgeVariant: Record<AdminOrderStatus, "warning" | "ai" | "default" | "success" | "destructive"> = {
  pending: "warning",
  processing: "ai",
  shipped: "default",
  delivered: "success",
  cancelled: "destructive",
}

const paymentBadgeVariant: Record<AdminPaymentStatus, "success" | "warning" | "destructive" | "outline"> = {
  paid: "success",
  pending: "warning",
  failed: "destructive",
  refunded: "outline",
}

export type OrdersTableProps = {
  orders: AdminOrderRow[]
  onView: (order: AdminOrderRow) => void
  onUpdateStatus: (order: AdminOrderRow, status: AdminOrderStatus) => void
  onCancel: (order: AdminOrderRow) => void
  /** Id of an order with a request in flight — its actions are disabled until it settles. */
  busyOrderId?: string | null
}

function ActionsMenu({ order, onView, onUpdateStatus, onCancel, busyOrderId }: {
  order: AdminOrderRow
} & Omit<OrdersTableProps, "orders">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${order.orderNumber}`}
        disabled={busyOrderId === order._id}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(order)}>
          <Eye className="size-4" />
          View Order
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <RefreshCw className="size-4" />
            Update Status
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={order.status}
              onValueChange={(value) => {
                if (value) onUpdateStatus(order, value as AdminOrderStatus)
              }}
            >
              {orderStatusSequence.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {orderStatusLabel[status]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        {isOrderCancellable(order) ? (
          <DropdownMenuItem variant="destructive" onClick={() => onCancel(order)}>
            <Ban className="size-4" />
            Cancel Order
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Orders table — full table on desktop, stacked cards below `md` so nothing breaks on mobile. */
function OrdersTable({ orders, ...actions }: OrdersTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 text-left">Order</th>
              <th className="px-3 py-2.5 text-left">Customer</th>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Items</th>
              <th className="px-3 py-2.5 text-left">Total</th>
              <th className="px-3 py-2.5 text-left">Payment</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                <td className="px-3 py-3 font-medium text-foreground">{order.orderNumber}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-col">
                    <span className="text-foreground">{order.customer?.name ?? "Unknown customer"}</span>
                    <span className="text-caption text-muted-foreground">{order.customer?.email}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatOrderDate(order.createdAt)}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {order.totalQuantity} {order.totalQuantity === 1 ? "item" : "items"}
                </td>
                <td className="px-3 py-3 font-medium text-foreground">{formatPrice(order.total)}</td>
                <td className="px-3 py-3">
                  {order.payment ? (
                    <Badge variant={paymentBadgeVariant[order.payment.status]}>
                      {paymentStatusLabel[order.payment.status]}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusBadgeVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  <ActionsMenu order={order} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {orders.map((order) => (
          <div key={order._id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-foreground">{order.orderNumber}</p>
                <p className="truncate text-caption text-muted-foreground">{order.customer?.name ?? "Unknown customer"}</p>
                <p className="truncate text-caption text-muted-foreground">{order.customer?.email}</p>
              </div>
              <ActionsMenu order={order} {...actions} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-small">
              <div>
                <span className="block text-caption text-muted-foreground">Date</span>
                {formatOrderDate(order.createdAt)}
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Items</span>
                {order.totalQuantity} {order.totalQuantity === 1 ? "item" : "items"}
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Total</span>
                <span className="font-medium text-foreground">{formatPrice(order.total)}</span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Payment</span>
                {order.payment ? (
                  <Badge variant={paymentBadgeVariant[order.payment.status]}>
                    {paymentStatusLabel[order.payment.status]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div className="mt-2.5">
              <Badge variant={statusBadgeVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export { OrdersTable }
