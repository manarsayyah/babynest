"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { fetchWishlist, addToWishlist, removeFromWishlist } from "@/lib/api-client/wishlist"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import type { ApiWishlistItem } from "@/lib/api-client/types"

const EMPTY_ITEMS: ApiWishlistItem[] = []

type WishlistContextValue = {
  /** Full wishlist entries (with product data) for the wishlist page. */
  items: ApiWishlistItem[]
  count: number
  isLoading: boolean
  error: string | null
  isWishlisted: (productId: string) => boolean
  /** Add-or-remove based on current state — what a product card's heart button calls. */
  toggle: (productId: string) => void
  /** Unconditional remove — what the wishlist page's own remove/clear actions call. */
  remove: (productId: string) => void
  refresh: () => void
}

const WishlistContext = React.createContext<WishlistContextValue | null>(null)

/**
 * Single source of truth for the signed-in user's wishlist, shared by the
 * Navbar count, product card hearts (grid + detail page), and the Wishlist
 * page itself — so all three always agree with the real backend state.
 * Mounted once in SiteChrome, above both the chromed and chromeless branches.
 */
function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [items, setItems] = React.useState<ApiWishlistItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    // Unauthenticated (or still resolving): never create an anonymous
    // request — GET /api/wishlist requires a session. `items`/`error` below
    // are masked at render time instead of reset here, to avoid a
    // synchronous setState in the effect body.
    if (status !== "authenticated") return

    let cancelled = false

    async function loadWishlist() {
      setIsLoading(true)
      setError(null)
      try {
        const result = await fetchWishlist()
        if (!cancelled) setItems(result)
      } catch (err) {
        if (!cancelled) {
          setItems([])
          setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadWishlist()
    return () => {
      cancelled = true
    }
  }, [status, reloadToken])

  // Masked at render time rather than reset via effect setState — logged
  // out (or still resolving) always presents as an empty, idle wishlist,
  // regardless of whatever `items` last held from a previous session.
  const isAuthenticated = status === "authenticated"
  const visibleItems = isAuthenticated ? items : EMPTY_ITEMS
  const visibleIsLoading = isAuthenticated && isLoading
  const visibleError = isAuthenticated ? error : null

  const productIds = React.useMemo(() => new Set(visibleItems.map((item) => item.productId)), [visibleItems])

  function goToLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`)
  }

  async function add(productId: string) {
    try {
      const createdItem = await addToWishlist(productId)
      setItems((prev) => (prev.some((item) => item.productId === productId) ? prev : [createdItem, ...prev]))
      toast.success("Added to wishlist")
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        // Already there server-side (e.g. another tab) — resync silently.
        setReloadToken((n) => n + 1)
        return
      }
      toast.error(err instanceof ApiRequestError ? err.message : "Couldn't add to wishlist. Please try again.")
    }
  }

  async function remove(productId: string) {
    const previousItems = items
    setItems((prev) => prev.filter((item) => item.productId !== productId))
    try {
      await removeFromWishlist(productId)
      toast("Removed from wishlist")
    } catch (err) {
      setItems(previousItems)
      toast.error(err instanceof ApiRequestError ? err.message : "Couldn't remove from wishlist. Please try again.")
    }
  }

  function toggle(productId: string) {
    if (status !== "authenticated") {
      goToLogin()
      return
    }
    if (productIds.has(productId)) {
      void remove(productId)
    } else {
      void add(productId)
    }
  }

  const value: WishlistContextValue = {
    items: visibleItems,
    count: visibleItems.length,
    isLoading: visibleIsLoading,
    error: visibleError,
    isWishlisted: (productId) => productIds.has(productId),
    toggle,
    remove: (productId) => {
      if (!isAuthenticated) return
      void remove(productId)
    },
    refresh: () => setReloadToken((n) => n + 1),
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

function useWishlist(): WishlistContextValue {
  const context = React.useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider")
  return context
}

export { WishlistProvider, useWishlist }
