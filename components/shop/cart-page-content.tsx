"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { ArrowLeft, Cloud, Headset, RotateCcw, ShieldCheck, ShoppingBag, Sparkles, TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { TrustStrip, type TrustStripItem } from "@/components/layout/trust-strip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
import { CartItemRow } from "@/components/shop/cart-item-row"
import { OrderSummary } from "@/components/shop/order-summary"
import { describePromo } from "@/lib/api-client/promotions"
import { useCart } from "@/components/providers/cart-provider"
import { addToWishlist } from "@/lib/api-client/wishlist"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { Skeleton } from "@/components/ui/skeleton"

const cartTrustItems: TrustStripItem[] = [
  { icon: ShieldCheck, title: "Secure Checkout", description: "100% protected payments" },
  { icon: RotateCcw, title: "Easy Returns", description: "30-day hassle-free returns" },
  { icon: Headset, title: "Customer Support", description: "We're here to help, 7 days a week" },
]

/** Full Cart page: item list with select/quantity/remove, order summary, promo code, trust strip. */
function CartPageContent() {
  const { status } = useSession()
  const { cart, error, refresh, setQuantity, removeItem, promo, applyPromo, removePromo } = useCart()
  const items = React.useMemo(() => cart?.items ?? [], [cart])

  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [pendingQuantity, setPendingQuantity] = React.useState<Record<string, number>>({})
  const [promoInput, setPromoInput] = React.useState("")
  const [isApplyingPromo, setIsApplyingPromo] = React.useState(false)
  const [promoError, setPromoError] = React.useState<string | null>(null)

  // Selection is only meaningful for lines that still exist in the server cart.
  const selectedIds = React.useMemo(() => {
    const present = new Set(items.map((item) => item.id))
    return new Set([...selected].filter((id) => present.has(id)))
  }, [selected, items])

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((item) => item.id)))
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleRemove(id: string) {
    if (await removeItem(id)) toast("Item removed from cart")
  }

  async function handleMoveToWishlist(id: string, productId: string | undefined, name: string) {
    if (!productId) {
      await handleRemove(id)
      return
    }
    try {
      await addToWishlist(productId)
    } catch (err) {
      // 409 = already on the wishlist, which is the state we want anyway.
      if (!(err instanceof ApiRequestError && err.status === 409)) {
        toast.error(err instanceof ApiRequestError ? err.message : "Couldn't move to wishlist. Please try again.")
        return
      }
    }
    if (await removeItem(id)) toast(`${name} moved to wishlist`)
  }

  async function handleQuantityChange(id: string, quantity: number) {
    setPendingQuantity((prev) => ({ ...prev, [id]: quantity }))
    await setQuantity(id, quantity)
    setPendingQuantity((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function removeSelected() {
    const ids = [...selectedIds]
    const results = await Promise.all(ids.map((id) => removeItem(id)))
    const removed = results.filter(Boolean).length
    setSelected(new Set())
    if (removed > 0) toast(`${removed} ${removed === 1 ? "item" : "items"} removed from cart`)
  }

  async function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase()
    if (!code) {
      setPromoError("Enter a promo code")
      return
    }
    setIsApplyingPromo(true)
    // The server validates the code and calculates the discount; nothing is computed here.
    const failure = await applyPromo(code)
    setIsApplyingPromo(false)
    if (failure) {
      setPromoError(failure)
      return
    }
    setPromoError(null)
    setPromoInput("")
    toast.success("Promo code applied")
  }

  function handleRemovePromo() {
    removePromo()
    toast("Promo code removed")
  }

  const subtotal = cart?.subtotal ?? 0
  const shipping = cart?.shipping ?? 0
  const freeShippingThreshold = cart?.freeShippingThreshold ?? 0
  const discountAmount = promo?.discountApplied ?? 0

  return (
    <main className="flex-1">
      <div className="relative overflow-hidden border-b border-border bg-card">
        <span
          aria-hidden
          className="absolute -top-6 right-8 hidden size-16 items-center justify-center rounded-full bg-accent/60 text-primary/70 blur-[1px] sm:flex"
        >
          <Cloud className="size-8" />
        </span>
        <Container className="flex flex-col gap-3 py-8 sm:py-10">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Cart" }]} />
          <h1 className="text-h1 text-foreground">Your Shopping Cart</h1>
        </Container>
      </div>

      <Container className="section-y flex flex-col gap-10">
        {status === "unauthenticated" ? (
          <EmptyState
            icon={ShoppingBag}
            title="Sign in to view your cart"
            description="Your cart is saved to your BabyNest account."
            action={
              <Button size="lg" nativeButton={false} render={<Link href="/login?callbackUrl=/cart" />}>
                Sign in
              </Button>
            }
          />
        ) : status === "loading" || (!cart && !error) ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        ) : error ? (
          <EmptyState
            icon={TriangleAlert}
            title="Couldn't load your cart"
            description={error}
            action={
              <Button variant="outline" onClick={refresh}>
                Try again
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Your cart is empty"
            description="Looks like you haven't added anything to your cart yet. Let's find something your little one will love."
            action={
              <Button size="lg" nativeButton={false} render={<Link href="/products" />}>
                Continue Shopping
              </Button>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2.5 text-small font-semibold uppercase tracking-wide text-muted-foreground">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all items"
                    />
                    Product
                  </CardTitle>
                  {selectedIds.size > 0 ? (
                    <button
                      type="button"
                      onClick={() => void removeSelected()}
                      className="text-small text-destructive hover:underline"
                    >
                      Remove selected ({selectedIds.size})
                    </button>
                  ) : (
                    <div className="hidden items-center gap-10 text-caption font-semibold uppercase tracking-wide text-muted-foreground sm:flex">
                      <span className="w-24 text-center">Price</span>
                      <span className="w-28 text-center">Quantity</span>
                      <span className="w-24 text-right">Total</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      quantity={pendingQuantity[item.id] ?? item.quantity}
                      selected={selectedIds.has(item.id)}
                      onToggleSelect={() => toggleSelect(item.id)}
                      onQuantityChange={(quantity) => void handleQuantityChange(item.id, quantity)}
                      onRemove={() => void handleRemove(item.id)}
                      onMoveToWishlist={() =>
                        void handleMoveToWishlist(item.id, item.product?.id, item.product?.name ?? "Item")
                      }
                    />
                  ))}
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="lg"
                className="w-fit"
                nativeButton={false}
                render={<Link href="/products" />}
              >
                <ArrowLeft data-icon="inline-start" />
                Continue Shopping
              </Button>

              <div className="flex items-start gap-2 rounded-xl border border-ai-border bg-ai-muted/40 p-3.5 text-small text-ai-muted-foreground">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-ai" />
                Free shipping unlocks automatically once your subtotal reaches{" "}
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                  freeShippingThreshold
                )}
                .
              </div>
            </div>

            <OrderSummary
              subtotal={subtotal}
              shipping={shipping}
              discountAmount={discountAmount}
              discountCode={promo?.code ?? null}
              discountLabel={promo ? describePromo(promo) : undefined}
              isApplyingPromo={isApplyingPromo}
              freeShippingThreshold={freeShippingThreshold}
              checkoutBlocked={cart?.hasUnavailableItems ?? false}
              promoInput={promoInput}
              onPromoInputChange={(value) => {
                setPromoInput(value)
                setPromoError(null)
              }}
              onApplyPromo={() => void handleApplyPromo()}
              onRemovePromo={handleRemovePromo}
              promoError={promoError}
              className="lg:sticky lg:top-20"
            />
          </div>
        )}

        <TrustStrip items={cartTrustItems} />
      </Container>
    </main>
  )
}

export { CartPageContent }
