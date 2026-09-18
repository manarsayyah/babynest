"use client"

import { Loader2, Lock, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/product/product-card"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { ApiCartItem } from "@/lib/api-client/types"

export type CheckoutOrderSummaryProps = {
  /** The real active cart lines — every figure below is server-calculated. */
  items: ApiCartItem[]
  subtotal: number
  shipping: number
  /** Server-validated promotion applied to this order (code + the API's discount) — null if none. */
  discountCode?: string | null
  discountAmount?: number
  total: number
  onPlaceOrder: () => void
  isSubmitting: boolean
  /** True when the cart has lines that can't currently be purchased (blocks placing the order). */
  blocked?: boolean
  className?: string
}

/** Order items + totals + "Place Order" — the third checkout card. */
function CheckoutOrderSummary({
  items,
  subtotal,
  shipping,
  discountCode = null,
  discountAmount = 0,
  total,
  onPlaceOrder,
  isSubmitting,
  blocked = false,
  className,
}: CheckoutOrderSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3.5">
          {items.map((item) => {
            const name = item.product?.name ?? "Unavailable item"
            const variantLabel = [item.variant?.color, item.variant?.size].filter(Boolean).join(" · ")
            return (
              <li key={item.id} className="flex items-center gap-3">
                <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image ?? PLACEHOLDER_PRODUCT_IMAGE} alt={name} className="size-full object-cover" />
                </span>
                <span className="flex flex-1 flex-col text-small text-foreground">
                  <span>
                    {name}
                    {item.quantity > 1 ? <span className="text-muted-foreground"> ×{item.quantity}</span> : null}
                  </span>
                  {variantLabel ? <span className="text-caption text-muted-foreground">{variantLabel}</span> : null}
                  {item.availability !== "available" ? (
                    <span className="text-caption font-medium text-destructive">
                      {item.availability === "insufficient_stock"
                        ? `Only ${item.variant?.stockQty ?? 0} left in stock`
                        : item.availability === "out_of_stock"
                          ? "Out of stock"
                          : "No longer available"}
                    </span>
                  ) : null}
                </span>
                <span className="text-small font-medium text-foreground">{formatPrice(item.lineTotal)}</span>
              </li>
            )
          })}
        </ul>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">Shipping</span>
          <span className="font-medium text-foreground">{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
        </div>
        {discountCode ? (
          <div className="flex items-center justify-between text-small">
            <span className="flex items-center gap-2 text-muted-foreground">
              Discount
              <Badge variant="secondary">{discountCode}</Badge>
            </span>
            <span className="font-medium text-success">-{formatPrice(discountAmount)}</span>
          </div>
        ) : null}

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-body font-semibold text-foreground">Total</span>
          <span className="text-h3 text-foreground">{formatPrice(total)}</span>
        </div>

        <Button size="xl" className="w-full" onClick={onPlaceOrder} disabled={isSubmitting || blocked}>
          {isSubmitting ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Placing Order...
            </>
          ) : (
            <>
              <Lock data-icon="inline-start" />
              Place Order
            </>
          )}
        </Button>
        {blocked ? (
          <p className="text-center text-caption text-destructive">
            Update your cart to remove unavailable items before placing your order.
          </p>
        ) : null}

        <p className="flex items-center justify-center gap-1.5 text-caption text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" />
          You&apos;ll pay in cash when your order arrives
        </p>
      </CardContent>
    </Card>
  )
}

export { CheckoutOrderSummary }
