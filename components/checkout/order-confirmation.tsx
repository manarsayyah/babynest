import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/product/product-card"
import { PAYMENT_METHOD_LABEL, orderStatusLabel, type ApiCreatedOrder } from "@/lib/api-client/orders"

export type OrderConfirmationProps = {
  /** The order exactly as the server created it. */
  result: ApiCreatedOrder
}

/** Shown in place of the checkout form once the server has created the order — every value comes from the API response. */
function OrderConfirmation({ result }: OrderConfirmationProps) {
  const { order } = result
  const address = order.shippingAddress
  const cityLine = [address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ")

  return (
    <main className="flex flex-1 items-center">
      <Container className="section-y flex flex-col items-center gap-5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="text-h1 text-foreground">Order Confirmed!</h1>
        <p className="max-w-md text-body text-muted-foreground">
          Thank you for your order. It will be delivered to the address below, and you&apos;ll pay in cash when it
          arrives.
        </p>

        <div className="flex flex-col items-center gap-1 rounded-2xl bg-card px-8 py-5 ring-1 ring-foreground/10">
          <span className="text-caption uppercase tracking-wide text-muted-foreground">Order Number</span>
          <span className="text-h3 text-foreground">{order.orderNumber}</span>
          <Badge variant="warning" className="mt-1">
            {orderStatusLabel[order.status]}
          </Badge>
          <span className="mt-1 text-small text-muted-foreground">
            Total to pay on delivery: <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
          </span>
          <span className="text-small text-muted-foreground">Payment: {PAYMENT_METHOD_LABEL}</span>
        </div>

        <div className="flex flex-col gap-0.5 text-small">
          <span className="text-caption uppercase tracking-wide text-muted-foreground">Delivering to</span>
          <span className="font-medium text-foreground">{address.fullName}</span>
          <span className="text-muted-foreground">
            {address.street}
            {address.apartment ? `, ${address.apartment}` : ""}
          </span>
          <span className="text-muted-foreground">{cityLine}</span>
          <span className="text-muted-foreground">{address.phone}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button size="xl" nativeButton={false} render={<Link href={`/orders/${order._id}`} />}>
            View Order
          </Button>
          <Button size="xl" variant="outline" nativeButton={false} render={<Link href="/products" />}>
            Continue Shopping
          </Button>
        </div>
      </Container>
    </main>
  )
}

export { OrderConfirmation }
