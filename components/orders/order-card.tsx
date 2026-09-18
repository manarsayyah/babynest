"use client"

import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, CreditCard, MapPin, ShoppingCart, Star, Truck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/components/product/product-card"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderProgressTracker } from "@/components/orders/order-progress-tracker"
import { useCart } from "@/components/providers/cart-provider"
import type { Order } from "@/lib/api-client/orders"

function SummaryField({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className={emphasize ? "text-small font-semibold text-foreground" : "text-small text-foreground"}>
        {value}
      </span>
    </div>
  )
}

export type OrderCardProps = {
  order: Order
}

/** One order card — header/status, product thumbnails, summary grid, tracker (if active), contextual actions. */
function OrderCard({ order }: OrderCardProps) {
  const { buyAgain } = useCart()
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const visibleItems = order.items.slice(0, 3)
  const extraCount = order.items.length - visibleItems.length
  const detailHref = `/orders/${order.routeId}`

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-small font-semibold text-foreground">{order.id}</span>
            <span className="text-caption text-muted-foreground">{order.date}</span>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <Link
          href={detailHref}
          className="flex items-center gap-1 text-small font-medium text-primary hover:underline"
        >
          View Details
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {visibleItems.map((item) => (
          <Link
            key={`${item.product.id}-${item.variantId ?? ""}`}
            href={`/products/${item.product.slug}`}
            className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.product.image} alt={item.product.name} className="size-full object-cover" />
          </Link>
        ))}
        {extraCount > 0 ? (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-caption font-medium text-muted-foreground">
            +{extraCount} more
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
        <SummaryField label="Items" value={`${totalQuantity} items`} />
        <SummaryField label="Subtotal" value={formatPrice(order.subtotal)} />
        <SummaryField label="Shipping" value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
        <SummaryField label="Total" value={formatPrice(order.total)} emphasize />
      </div>

      <div className="mt-3 flex flex-col gap-1.5 text-caption text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <span className="flex items-center gap-1.5">
          <CreditCard className="size-3.5" />
          {order.paymentMethod}
        </span>
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {order.shippingName} • {order.shippingCity}
        </span>
        {order.status === "delivered" && order.deliveredDate ? (
          <span className="flex items-center gap-1.5 text-success">
            <MapPin className="size-3.5" />
            Delivered {order.deliveredDate}
          </span>
        ) : null}
      </div>

      {order.status === "pending" || order.status === "processing" || order.status === "shipped" ? (
        <div className="mt-5 border-t border-border pt-5">
          <OrderProgressTracker status={order.status} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {order.status === "delivered" ? (
          <>
            <Button onClick={() => void buyAgain(order.items)}>
              <ShoppingCart data-icon="inline-start" />
              Buy Again
            </Button>
            <Button
              variant="secondary"
              onClick={() => toast("Review form isn't wired up yet", { description: "This is a frontend-only demo." })}
            >
              <Star data-icon="inline-start" />
              Write a Review
            </Button>
            <Button variant="outline" nativeButton={false} render={<Link href={detailHref} />}>
              View Details
            </Button>
          </>
        ) : order.status === "shipped" ? (
          <>
            <Button nativeButton={false} render={<Link href={detailHref} />}>
              <Truck data-icon="inline-start" />
              Track Order
            </Button>
            <Button variant="secondary" nativeButton={false} render={<Link href={detailHref} />}>
              View Details
            </Button>
          </>
        ) : order.status === "pending" || order.status === "processing" ? (
          <Button variant="secondary" nativeButton={false} render={<Link href={detailHref} />}>
            View Details
          </Button>
        ) : (
          <>
            <Button variant="secondary" nativeButton={false} render={<Link href={detailHref} />}>
              View Details
            </Button>
            <Button variant="outline" onClick={() => void buyAgain(order.items)}>
              <ShoppingCart data-icon="inline-start" />
              Buy Again
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

export { OrderCard }
