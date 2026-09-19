"use client"

import * as React from "react"
import Link from "next/link"
import { Lock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FormError } from "@/components/ui/form-error"
import { formatPrice } from "@/components/product/product-card"

export type OrderSummaryProps = {
  subtotal: number
  shipping: number
  discountAmount: number
  discountCode: string | null
  /** Server-described discount, e.g. "15% off". */
  discountLabel?: string
  isApplyingPromo?: boolean
  /** Server-provided free-shipping threshold. */
  freeShippingThreshold: number
  /** True when the server cart has lines that can't currently be purchased. */
  checkoutBlocked?: boolean
  promoInput: string
  onPromoInputChange: (value: string) => void
  onApplyPromo: () => void
  onRemovePromo: () => void
  promoError: string | null
  className?: string
}

/** "Order Summary" card — subtotal/shipping/discount/total, promo code, checkout CTA. */
function OrderSummary({
  subtotal,
  shipping,
  discountAmount,
  discountCode,
  discountLabel,
  isApplyingPromo = false,
  freeShippingThreshold,
  checkoutBlocked = false,
  promoInput,
  onPromoInputChange,
  onApplyPromo,
  onRemovePromo,
  promoError,
  className,
}: OrderSummaryProps) {
  const total = Math.max(0, subtotal + shipping - discountAmount)
  const amountToFreeShipping = freeShippingThreshold - subtotal

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-small">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">
              {shipping === 0 ? "Free" : formatPrice(shipping)}
            </span>
          </div>
          <span className="text-caption text-muted-foreground">
            {shipping === 0
              ? `Free shipping over ${formatPrice(freeShippingThreshold)}`
              : `Add ${formatPrice(amountToFreeShipping)} more for free shipping`}
          </span>
        </div>

        {discountCode ? (
          <div className="flex items-center justify-between text-small">
            <span className="flex items-center gap-2 text-muted-foreground">
              Discount
              <Badge variant="secondary">{discountCode}</Badge>
              {discountLabel ? <span className="text-caption">({discountLabel})</span> : null}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-medium text-success">-{formatPrice(discountAmount)}</span>
              <button
                type="button"
                onClick={onRemovePromo}
                className="text-caption text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Remove
              </button>
            </span>
          </div>
        ) : null}

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <span className="text-body font-semibold text-foreground">Total</span>
          <span className="text-h3 text-foreground">{formatPrice(total)}</span>
        </div>

        {!discountCode ? (
          <div className="flex flex-col gap-1.5">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onApplyPromo()
              }}
              className="flex gap-2"
            >
              <Input
                value={promoInput}
                onChange={(e) => onPromoInputChange(e.target.value)}
                placeholder="Enter promo code"
                aria-label="Promo code"
                className="h-10 flex-1 rounded-full"
              />
              <Button type="submit" variant="secondary" disabled={isApplyingPromo}>
                {isApplyingPromo ? "Checking..." : "Apply"}
              </Button>
            </form>
            <FormError message={promoError} />
          </div>
        ) : null}

        {checkoutBlocked ? (
          <>
            <Button size="xl" className="w-full" disabled>
              <Lock data-icon="inline-start" />
              Proceed to Checkout
            </Button>
            <span className="text-center text-caption text-destructive">
              Remove or update unavailable items to continue.
            </span>
          </>
        ) : (
          <Button size="xl" className="w-full" nativeButton={false} render={<Link href="/checkout" />}>
            <Lock data-icon="inline-start" />
            Proceed to Checkout
          </Button>
        )}

        <div className="flex flex-col items-center gap-2 pt-1">
          <span className="text-caption text-muted-foreground">Payment method</span>
          <Badge variant="outline" className="text-muted-foreground">
            Cash on Delivery
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export { OrderSummary }
