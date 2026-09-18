"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Cloud, ShoppingBag, TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckoutHeader } from "@/components/checkout/checkout-header"
import { CheckoutStepper } from "@/components/checkout/checkout-stepper"
import { ContactShippingForm } from "@/components/checkout/contact-shipping-form"
import { ShippingPaymentForm } from "@/components/checkout/shipping-payment-form"
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary"
import { OrderConfirmation } from "@/components/checkout/order-confirmation"
import { useCart } from "@/components/providers/cart-provider"
import { fetchAddresses, type SavedAddress } from "@/lib/api-client/addresses"
import { createOrder, type ApiCreatedOrder } from "@/lib/api-client/orders"
import { ApiRequestError } from "@/lib/api-client/fetcher"

/** Full Checkout page: real cart, saved-address selection, Cash on Delivery, and the server-created order confirmation. */
function CheckoutPageContent() {
  const { data: session, status } = useSession()
  const { cart, error: cartError, refresh: refreshCart, promo, removePromo } = useCart()

  const [addresses, setAddresses] = React.useState<SavedAddress[] | null>(null)
  const [addressesError, setAddressesError] = React.useState<string | null>(null)
  const [addressReloadToken, setAddressReloadToken] = React.useState(0)
  const [chosenAddressId, setChosenAddressId] = React.useState<string | null>(null)
  const [selectionError, setSelectionError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  // Synchronous guard: state updates are async, so two rapid clicks could otherwise both pass an `isSubmitting` check.
  const submittingRef = React.useRef(false)
  const [placedOrder, setPlacedOrder] = React.useState<ApiCreatedOrder | null>(null)

  const isAuthenticated = status === "authenticated"

  React.useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false

    async function load() {
      try {
        const result = await fetchAddresses()
        if (cancelled) return
        setAddresses(result)
        setAddressesError(null)
      } catch {
        if (cancelled) return
        setAddresses(null)
        setAddressesError("Couldn't load your saved addresses. Please try again.")
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, addressReloadToken])

  // The customer's explicit pick if it still exists, otherwise their default address (the API lists it first).
  const selectedAddressId = React.useMemo(() => {
    if (!addresses || addresses.length === 0) return null
    if (chosenAddressId && addresses.some((address) => address.id === chosenAddressId)) return chosenAddressId
    return (addresses.find((address) => address.isDefault) ?? addresses[0]).id
  }, [addresses, chosenAddressId])

  async function handlePlaceOrder() {
    if (submittingRef.current) return

    if (!selectedAddressId) {
      setSelectionError("Select a delivery address to place your order.")
      toast.error("Please select a delivery address")
      return
    }
    setSelectionError(null)

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const result = await createOrder(selectedAddressId, promo?.code)
      setPlacedOrder(result)
      removePromo()
      // Cart clearing happens server-side; re-read it so the navbar/cart page show the real (empty) state.
      refreshCart()
      toast.success("Order placed!", { description: `Order ${result.order.orderNumber} confirmed.` })
    } catch (err) {
      const message =
        err instanceof ApiRequestError && err.status < 500
          ? err.message
          : "We couldn't place your order. Please try again."
      // The server rejected the promotion itself (e.g. it expired meanwhile): drop it so the order can still be placed.
      if (promo && /promotion/i.test(message)) removePromo()
      toast.error(message)
      // Stock/availability may have changed — show the cart as the server now sees it.
      refreshCart()
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const items = cart?.items ?? []

  let body: React.ReactNode
  if (placedOrder) {
    body = <OrderConfirmation result={placedOrder} />
  } else if (status === "unauthenticated") {
    body = (
      <main className="flex-1">
        <Container className="section-y">
          <EmptyState
            icon={ShoppingBag}
            title="Sign in to check out"
            description="Your cart and delivery addresses are saved to your BabyNest account."
            action={
              <Button size="lg" nativeButton={false} render={<Link href="/login?callbackUrl=/checkout" />}>
                Sign in
              </Button>
            }
          />
        </Container>
      </main>
    )
  } else if (status === "loading" || (!cart && !cartError)) {
    body = (
      <main className="flex-1">
        <Container className="section-y grid gap-6 lg:grid-cols-[1.1fr_1fr_340px] lg:items-start">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </Container>
      </main>
    )
  } else if (cartError) {
    body = (
      <main className="flex-1">
        <Container className="section-y">
          <EmptyState
            icon={TriangleAlert}
            title="Couldn't load your cart"
            description={cartError}
            action={
              <Button variant="outline" onClick={refreshCart}>
                Try again
              </Button>
            }
          />
        </Container>
      </main>
    )
  } else if (items.length === 0) {
    body = (
      <main className="flex-1">
        <Container className="section-y">
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Add something to your cart before checking out."
            action={
              <Button size="lg" nativeButton={false} render={<Link href="/products" />}>
                Continue Shopping
              </Button>
            }
          />
        </Container>
      </main>
    )
  } else {
    body = (
      <main className="relative flex-1 overflow-hidden">
        <span
          aria-hidden
          className="absolute -top-4 right-8 hidden size-16 items-center justify-center rounded-full bg-accent/60 text-primary/70 blur-[1px] sm:flex"
        >
          <Cloud className="size-8" />
        </span>

        <Container className="section-y flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Checkout" }]} />
            <CheckoutStepper currentStep={1} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr_340px] lg:items-start">
            <ContactShippingForm
              email={session?.user?.email ?? ""}
              addresses={addresses}
              addressesError={addressesError}
              selectedAddressId={selectedAddressId}
              onSelectAddress={(id) => {
                setChosenAddressId(id)
                setSelectionError(null)
              }}
              selectionError={selectionError}
              onRetryAddresses={() => setAddressReloadToken((n) => n + 1)}
            />
            <ShippingPaymentForm shippingCost={cart?.shipping ?? 0} />
            <CheckoutOrderSummary
              items={items}
              subtotal={cart?.subtotal ?? 0}
              shipping={cart?.shipping ?? 0}
              discountCode={promo?.code ?? null}
              discountAmount={promo?.discountApplied ?? 0}
              // Estimate only: shipping + subtotal from the cart API, discount from the promotions API. The order total is decided by the server.
              total={Math.max(0, (cart?.total ?? 0) - (promo?.discountApplied ?? 0))}
              onPlaceOrder={() => void handlePlaceOrder()}
              isSubmitting={isSubmitting}
              blocked={cart?.hasUnavailableItems ?? false}
              className="lg:sticky lg:top-6"
            />
          </div>
        </Container>
      </main>
    )
  }

  return (
    <>
      <CheckoutHeader />
      {body}
    </>
  )
}

export { CheckoutPageContent }
