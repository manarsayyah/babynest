"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { CircleHelp, Download, MapPin, ShoppingCart, Truck, XCircle } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Rating } from "@/components/product/rating"
import { formatPrice } from "@/components/product/product-card"
import { OrderStatusBadge } from "@/components/orders/order-status-badge"
import { OrderProgressTracker } from "@/components/orders/order-progress-tracker"
import { OrderActivityCard } from "@/components/orders/order-activity-card"
import { ReturnsRefundsCard } from "@/components/orders/returns-refunds-card"
import { BillingInformationCard } from "@/components/orders/billing-information-card"
import { DeliverySupportCard } from "@/components/orders/delivery-support-card"
import { WriteReviewDialog, type WriteReviewTarget } from "@/components/orders/write-review-dialog"
import { StartReturnDialog } from "@/components/orders/start-return-dialog"
import { OrderDetailSkeleton } from "@/components/orders/order-detail-skeleton"
import { OrderDetailError } from "@/components/orders/order-detail-error"
import { useCart } from "@/components/providers/cart-provider"
import { OrderReturnsCard } from "@/components/orders/order-returns-card"
import { fetchOrder, type Order } from "@/lib/api-client/orders"
import { cancelReturn, fetchOrderReturns, type ReturnRecord } from "@/lib/api-client/returns"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { initialProfile } from "@/lib/mock/account"

function Row({
  label,
  value,
  valueClassName = "text-foreground",
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between text-small">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${valueClassName}`}>{value}</span>
    </div>
  )
}

/** Expanded order detail: status tracker, items, activity timeline, AI insights, returns, and a payment/shipping/billing/support sidebar. */
function OrderDetailContent({ orderId }: { orderId: string }) {
  const { buyAgain } = useCart()
  const [order, setOrder] = React.useState<Order | null>(null)
  const [failure, setFailure] = React.useState<"not-found" | "unauthorized" | "error" | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [reviewProduct, setReviewProduct] = React.useState<WriteReviewTarget | null>(null)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = React.useState(false)
  const [returns, setReturns] = React.useState<ReturnRecord[] | null>(null)
  const [returnsError, setReturnsError] = React.useState<string | null>(null)
  const [returnsToken, setReturnsToken] = React.useState(0)
  const [cancellingReturnId, setCancellingReturnId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchOrder(orderId)
        if (cancelled) return
        setOrder(result)
        setFailure(null)
      } catch (err) {
        if (cancelled) return
        setOrder(null)
        if (err instanceof ApiRequestError && err.status === 404) setFailure("not-found")
        else if (err instanceof ApiRequestError && err.status === 401) setFailure("unauthorized")
        else setFailure("error")
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [orderId, reloadToken])

  const loadedOrderId = order?.routeId ?? null
  React.useEffect(() => {
    if (!loadedOrderId) return
    let cancelled = false

    async function loadReturns() {
      try {
        const result = await fetchOrderReturns(loadedOrderId as string)
        if (cancelled) return
        setReturns(result)
        setReturnsError(null)
      } catch {
        if (cancelled) return
        setReturns(null)
        setReturnsError("Couldn't load your return requests.")
      }
    }

    void loadReturns()
    return () => {
      cancelled = true
    }
  }, [loadedOrderId, returnsToken])

  async function handleCancelReturn(returnId: string) {
    setCancellingReturnId(returnId)
    try {
      await cancelReturn(returnId)
      toast.success("Return request cancelled")
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError && err.status < 500
          ? err.message
          : "Couldn't cancel this return request. Please try again."
      )
    } finally {
      setCancellingReturnId(null)
      setReturnsToken((n) => n + 1)
    }
  }

  if (failure === "not-found") {
    return (
      <OrderDetailError
        title="Order Not Found"
        description="We couldn't find this order in your account."
        action={{ label: "View My Orders", href: "/account/orders" }}
      />
    )
  }
  if (failure === "unauthorized") {
    return (
      <OrderDetailError
        title="Sign in to view this order"
        description="Your session has expired. Please sign in again."
        action={{ label: "Sign in", href: `/login?callbackUrl=${encodeURIComponent(`/orders/${orderId}`)}` }}
      />
    )
  }
  if (failure === "error") {
    return <OrderDetailError onRetry={() => setReloadToken((n) => n + 1)} />
  }
  if (!order) {
    return <OrderDetailSkeleton />
  }

  function handleBuyAgain() {
    if (order) void buyAgain(order.items)
  }

  function handleDownloadInvoice() {
    toast("Invoice downloads aren't available yet")
  }

  function handleNeedHelp() {
    document.getElementById("delivery-support")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function handleTrackPackage() {
    if (!order) return
    toast(`Tracking number: ${order.trackingNumber}`, {
      description: order.carrier ? `Carrier: ${order.carrier}` : undefined,
    })
  }

  function handleContactSupport() {
    toast("We've notified our support team", {
      description: "Someone will reach out about this order shortly. (Frontend-only demo.)",
    })
  }

  function handleReportIssue() {
    toast.success("Issue reported", { description: "Our team will review your order shortly." })
  }

  return (
    <main className="flex-1">
      <Container className="account-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "My Orders", href: "/account/orders" },
                { label: `Order ${order.id}` },
              ]}
            />

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-account-title text-foreground">Order {order.id}</h1>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-body text-muted-foreground">Placed on {order.date}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleBuyAgain}>
                  <ShoppingCart data-icon="inline-start" />
                  Buy Again
                </Button>
                <Button variant="secondary" onClick={handleDownloadInvoice}>
                  <Download data-icon="inline-start" />
                  Download Invoice
                </Button>
                <Button variant="outline" onClick={handleNeedHelp}>
                  <CircleHelp data-icon="inline-start" />
                  Need Help?
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="flex flex-col gap-6">
              {order.status === "cancelled" ? (
                <Card className="flex flex-row items-center gap-3 border-destructive/20 bg-destructive/5 p-5">
                  <XCircle className="size-5 shrink-0 text-destructive" />
                  <p className="text-small text-foreground">
                    {order.paymentStatus === "Refunded"
                      ? "This order was cancelled and your payment has been refunded."
                      : "This order was cancelled."}
                  </p>
                </Card>
              ) : (
                <Card className="p-5 sm:p-6">
                  <h2 className="font-heading text-base leading-snug font-medium text-foreground">Order Status</h2>
                  <div className="mt-5">
                    <OrderProgressTracker status={order.status} />
                  </div>
                  {order.status === "delivered" && order.deliveredDate ? (
                    <p className="mt-5 flex items-center gap-1.5 border-t border-border pt-4 text-small font-medium text-success">
                      <MapPin className="size-4" />
                      Delivered on {order.deliveredDate}
                    </p>
                  ) : null}
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-h3">Items in Your Order</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col divide-y divide-border">
                  {order.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.variantId ?? ""}`}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:flex-wrap sm:items-center"
                    >
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="size-full object-cover"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:basis-40">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="text-small font-semibold text-foreground hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant ? (
                          <span className="text-caption text-muted-foreground">{item.variant}</span>
                        ) : null}
                        {item.product.rating !== undefined ? <Rating value={item.product.rating} size="sm" /> : null}
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
                        <span className="text-caption text-muted-foreground">
                          Qty {item.quantity} · {formatPrice(item.product.price)} each
                        </span>
                        <span className="text-small font-semibold text-foreground">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex shrink-0 gap-2 sm:basis-full sm:pl-[calc(4rem+0.75rem)]">
                        <Button
                          variant="outline"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/products/${item.product.slug}`} />}
                        >
                          View Product
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setReviewProduct({ productId: item.product.id, productName: item.product.name })}
                        >
                          Write a Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <OrderActivityCard order={order} />

              <ReturnsRefundsCard onStartReturn={() => setIsReturnDialogOpen(true)} />

              <OrderReturnsCard
                order={order}
                returns={returns}
                error={returnsError}
                cancellingId={cancellingReturnId}
                onCancel={(id) => void handleCancelReturn(id)}
                onRetry={() => setReturnsToken((n) => n + 1)}
              />
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-h3">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2.5">
                  <Row label="Subtotal" value={formatPrice(order.subtotal)} />
                  {order.discount > 0 ? (
                    <Row label="Discount" value={`-${formatPrice(order.discount)}`} valueClassName="text-success" />
                  ) : null}
                  <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
                  <Row label="Tax" value={formatPrice(order.tax)} />
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-body font-semibold text-foreground">Total</span>
                    <span className="text-h2 text-primary">{formatPrice(order.total)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-caption text-muted-foreground">Payment status</span>
                    <Badge variant={order.paymentStatus === "Paid" ? "success" : "outline"}>
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <Row label="Payment method" value={order.paymentMethod} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-h3">Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-col gap-0.5 text-small">
                    <span className="font-medium text-foreground">{order.shippingName}</span>
                    <span className="text-muted-foreground">{order.shippingLine1}</span>
                    <span className="text-muted-foreground">{order.shippingCity}</span>
                    <span className="text-muted-foreground">{order.shippingPhone}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <Row label="Delivery Method" value={order.shippingMethod} />
                  {order.carrier ? <Row label="Carrier" value={order.carrier} /> : null}
                  {order.shippedDate ? <Row label="Shipped" value={order.shippedDate} /> : null}
                  {order.estimatedDelivery ? <Row label="Estimated Delivery" value={order.estimatedDelivery} /> : null}
                  {order.deliveredDate ? <Row label="Delivered" value={order.deliveredDate} /> : null}
                  {order.trackingNumber ? <Row label="Tracking Number" value={order.trackingNumber} /> : null}
                  {order.trackingNumber ? (
                    <Button className="mt-1 w-full" onClick={handleTrackPackage}>
                      <Truck data-icon="inline-start" />
                      Track Package
                    </Button>
                  ) : null}
                </CardContent>
              </Card>

              <BillingInformationCard
                name={order.shippingName}
                addressLine1={order.shippingLine1}
                city={order.shippingCity}
                onDownloadInvoice={handleDownloadInvoice}
              />

              <DeliverySupportCard
                onContactSupport={handleContactSupport}
                onReportIssue={handleReportIssue}
                onReturnItems={() => setIsReturnDialogOpen(true)}
              />
            </div>
          </div>
        </div>
      </Container>

      <WriteReviewDialog target={reviewProduct} onClose={() => setReviewProduct(null)} onSaved={() => undefined} />
      {isReturnDialogOpen ? (
        <StartReturnDialog
          order={order}
          onClose={() => setIsReturnDialogOpen(false)}
          onSubmitted={() => setReturnsToken((n) => n + 1)}
        />
      ) : null}
    </main>
  )
}

export { OrderDetailContent }
