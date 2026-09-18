"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatPrice } from "@/components/product/product-card"

function OptionCard({
  selected,
  children,
}: {
  selected: boolean
  children: React.ReactNode
}) {
  return (
    <label
      className={
        "flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-colors " +
        (selected ? "border-primary bg-accent/40" : "border-border hover:bg-muted/50")
      }
    >
      {children}
    </label>
  )
}

export type ShippingPaymentFormProps = {
  /** Server-calculated shipping for this cart. */
  shippingCost: number
  className?: string
}

/**
 * "Shipping Method" + "Payment Method" — the second checkout card. BabyNest
 * ships with a single Standard Delivery method and takes Cash on Delivery
 * only, so each group has exactly one (pre-selected) option.
 */
function ShippingPaymentForm({ shippingCost, className }: ShippingPaymentFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Shipping Method</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value="standard" className="gap-3">
          <OptionCard selected>
            <span className="flex items-center gap-3">
              <RadioGroupItem value="standard" />
              <span className="flex flex-col">
                <span className="text-small font-medium text-foreground">Standard Shipping</span>
                <span className="text-caption text-muted-foreground">Delivered to your selected address</span>
              </span>
            </span>
            <span className={"text-small font-semibold " + (shippingCost === 0 ? "text-success" : "text-foreground")}>
              {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
            </span>
          </OptionCard>
        </RadioGroup>
      </CardContent>

      <CardHeader className="border-t border-border pt-6">
        <CardTitle className="text-h3">Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value="cod" className="gap-3">
          <OptionCard selected>
            <span className="flex items-center gap-3">
              <RadioGroupItem value="cod" />
              <span className="flex flex-col">
                <span className="text-small font-medium text-foreground">Cash on Delivery</span>
                <span className="text-caption text-muted-foreground">Pay in cash when your order arrives</span>
              </span>
            </span>
          </OptionCard>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

export { ShippingPaymentForm }
