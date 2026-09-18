"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  addCartItem,
  fetchCart,
  fetchProductVariants,
  removeCartItem,
  updateCartItemQuantity,
} from "@/lib/api-client/cart"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { validatePromotion, type AppliedPromo } from "@/lib/api-client/promotions"
import type { ApiCart } from "@/lib/api-client/types"

type CartContextValue = {
  /** The server's active cart, or null while loading / signed out / failed. */
  cart: ApiCart | null
  /** Total units across all lines — what the Navbar badge shows. */
  count: number
  error: string | null
  refresh: () => void
  /** The server-validated promotion, or null. The discount figure is the API's — never computed on the client. */
  promo: AppliedPromo | null
  /** Validates a code via the API. Resolves to a user-facing error message, or null on success. */
  applyPromo: (code: string) => Promise<string | null>
  removePromo: () => void
  /** Adds a real ProductVariant. Resolves true on success. Redirects to login when signed out. */
  addVariant: (variantId: string, quantity: number) => Promise<boolean>
  /** Add-to-cart from a card with no variant picker: adds directly only when the choice is unambiguous. */
  addProduct: (productId: string) => Promise<void>
  /** Re-adds the variants of a past order (quantities as ordered); the server re-checks stock and price. */
  buyAgain: (lines: { variantId?: string; quantity: number }[]) => Promise<void>
  setQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<boolean>
}

const CartContext = React.createContext<CartContextValue | null>(null)

function messageFrom(err: unknown, fallback: string) {
  return err instanceof ApiRequestError ? err.message : fallback
}

/**
 * Single source of truth for the signed-in user's cart, shared by the Navbar
 * badge, Add to Cart buttons and the Cart page. Every mutation is followed by
 * a re-fetch, so what's displayed is always what MongoDB holds.
 */
function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [cart, setCart] = React.useState<ApiCart | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const requestId = React.useRef(0)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [promo, setPromo] = React.useState<AppliedPromo | null>(null)

  const isAuthenticated = status === "authenticated"

  /** Re-reads the cart from the server. Only the latest request may write state. */
  const reload = React.useCallback(async () => {
    const id = ++requestId.current
    try {
      const result = await fetchCart()
      if (id !== requestId.current) return
      setCart(result)
      setError(null)
    } catch (err) {
      if (id !== requestId.current) return
      setCart(null)
      setError(messageFrom(err, "Something went wrong. Please try again."))
    }
  }, [])

  React.useEffect(() => {
    // Signed out / still resolving: never issue an anonymous request (GET /api/cart requires a session).
    if (!isAuthenticated) return
    let cancelled = false

    async function load() {
      try {
        const result = await fetchCart()
        if (cancelled) return
        setCart(result)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setCart(null)
        setError(messageFrom(err, "Something went wrong. Please try again."))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, reloadToken])

  // Keep the discount honest as the cart changes: re-validate the applied code against the server's current cart.
  const promoCode = promo?.code ?? null
  const cartSubtotal = cart?.subtotal
  React.useEffect(() => {
    if (!isAuthenticated || !promoCode) return
    let cancelled = false

    async function revalidate() {
      try {
        const fresh = await validatePromotion(promoCode as string)
        if (!cancelled) setPromo(fresh)
      } catch (err) {
        // Rejected by the server (expired, cart emptied, ...): drop it. A network failure keeps the last known value.
        if (!cancelled && err instanceof ApiRequestError && err.status < 500) setPromo(null)
      }
    }

    void revalidate()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, promoCode, cartSubtotal])

  async function applyPromo(code: string) {
    if (!isAuthenticated) return "Sign in to apply a promo code."
    try {
      setPromo(await validatePromotion(code))
      return null
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) return "Sign in to apply a promo code."
        if (err.status === 404) return "Invalid promo code"
        // 400s carry a safe, specific message (expired, inactive, not started, empty cart).
        if (err.status < 500) return err.message
      }
      return "Couldn't check that code right now. Please try again."
    }
  }

  const refresh = React.useCallback(() => setReloadToken((n) => n + 1), [])

  function goToLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`)
  }

  async function addVariant(variantId: string, quantity: number) {
    if (!isAuthenticated) {
      goToLogin()
      return false
    }
    try {
      await addCartItem(variantId, quantity)
      toast.success("Added to cart")
      await reload()
      return true
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        goToLogin()
        return false
      }
      toast.error(messageFrom(err, "Couldn't add to cart. Please try again."))
      await reload()
      return false
    }
  }

  async function addProduct(productId: string) {
    if (!isAuthenticated) {
      goToLogin()
      return
    }
    try {
      const { slug, variants } = await fetchProductVariants(productId)
      const inStock = variants.filter((variant) => variant.stockQty > 0)
      if (variants.length === 0 || inStock.length === 0) {
        toast.error("This product is out of stock.")
        return
      }
      if (variants.length > 1) {
        toast("Choose your options", { description: "Pick a color or size on the product page." })
        router.push(`/products/${slug}`)
        return
      }
      await addVariant(inStock[0]._id, 1)
    } catch (err) {
      toast.error(messageFrom(err, "Couldn't add to cart. Please try again."))
    }
  }

  async function buyAgain(lines: { variantId?: string; quantity: number }[]) {
    if (!isAuthenticated) {
      goToLogin()
      return
    }
    let added = 0
    let failed = 0
    for (const line of lines) {
      if (!line.variantId) {
        failed += 1
        continue
      }
      try {
        await addCartItem(line.variantId, line.quantity)
        added += 1
      } catch {
        failed += 1
      }
    }
    await reload()
    if (added > 0) {
      toast.success(added === 1 ? "Item added to cart" : `${added} items added to cart`, {
        description: failed > 0 ? `${failed} couldn't be added (unavailable or out of stock).` : undefined,
      })
    } else {
      toast.error("Those items are no longer available.")
    }
  }

  async function setQuantity(itemId: string, quantity: number) {
    try {
      await updateCartItemQuantity(itemId, quantity)
    } catch (err) {
      toast.error(messageFrom(err, "Couldn't update quantity. Please try again."))
    }
    await reload()
  }

  async function removeItem(itemId: string) {
    try {
      await removeCartItem(itemId)
      await reload()
      return true
    } catch (err) {
      // Already gone server-side (e.g. another tab) counts as removed.
      if (err instanceof ApiRequestError && err.status === 404) {
        await reload()
        return true
      }
      toast.error(messageFrom(err, "Couldn't remove item. Please try again."))
      await reload()
      return false
    }
  }

  // Masked at render time so a signed-out session never shows a previous user's cart.
  const visibleCart = isAuthenticated ? cart : null

  const value: CartContextValue = {
    cart: visibleCart,
    count: visibleCart?.itemCount ?? 0,
    error: isAuthenticated ? error : null,
    refresh,
    promo: isAuthenticated ? promo : null,
    applyPromo,
    removePromo: () => setPromo(null),
    addVariant,
    addProduct,
    buyAgain,
    setQuantity,
    removeItem,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart(): CartContextValue {
  const context = React.useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}

export { CartProvider, useCart }
