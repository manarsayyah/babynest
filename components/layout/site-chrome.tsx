"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { WishlistProvider, useWishlist } from "@/components/providers/wishlist-provider"
import { CartProvider, useCart } from "@/components/providers/cart-provider"

/** Routes that render their own self-contained layout instead of the global Navbar/Footer. */
const CHROMELESS_PREFIXES = ["/checkout", "/login", "/register", "/admin"]

/** Renders the actual chrome — split out so it can call useWishlist(), which needs WishlistProvider as an ancestor. */
function SiteChromeInner({ children, isChromeless }: { children: React.ReactNode; isChromeless: boolean }) {
  const { data: session, status } = useSession()
  const { count: wishlistCount } = useWishlist()
  const { count: cartCount } = useCart()

  if (isChromeless) return <>{children}</>

  return (
    <>
      <Navbar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        isAuthenticated={status === "authenticated"}
        role={session?.user?.role}
      />
      {children}
      <Footer />
    </>
  )
}

/**
 * Wraps every page with the global Navbar/Footer, except full-page flows
 * like checkout (minimal `CheckoutHeader`, reduces exit points during
 * purchase), login/register (split-screen auth layout with its own logo
 * mark), and admin (its own persistent sidebar/header shell, see
 * app/admin/layout.tsx) — standard patterns. Keeping this decision in one
 * client wrapper means every other route's rendered output is unchanged.
 *
 * WishlistProvider and CartProvider wrap both branches so wishlist/cart state
 * (and their Navbar counts) stay a single source of truth across the whole app.
 */
function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isChromeless = CHROMELESS_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  return (
    <WishlistProvider>
      <CartProvider>
        <SiteChromeInner isChromeless={isChromeless}>{children}</SiteChromeInner>
      </CartProvider>
    </WishlistProvider>
  )
}

export { SiteChrome }
