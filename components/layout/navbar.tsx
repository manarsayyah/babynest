"use client"

import * as React from "react"
import Link from "next/link"
import { Heart, Menu, Search, ShoppingBag, Sparkles, User, X } from "lucide-react"
import { Container } from "@/components/layout/container"

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/categories", label: "Categories" },
]

function IconLink({
  href,
  label,
  icon: Icon,
  count,
}: {
  href: string
  label: string
  icon: React.ElementType
  count?: number
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon className="size-[18px]" />
      {typeof count === "number" && count > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  )
}

export type NavbarProps = {
  cartCount?: number
  wishlistCount?: number
  isAuthenticated?: boolean
  /** Distinguishes an authenticated admin from an authenticated customer — the account icon routes admins to the Admin Dashboard instead of the customer Account area. */
  role?: "customer" | "admin"
}

/**
 * Global site navigation. Reused on every page (mounted once in the root
 * layout). Cart/wishlist counts and auth state are passed in as props so
 * this component stays decoupled from whichever data layer ends up wiring
 * it (Phase 7 cart/wishlist, real session data now wired via SiteChrome).
 */
function Navbar({ cartCount = 0, wishlistCount = 0, isAuthenticated = false, role }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const accountHref = !isAuthenticated ? "/login" : role === "admin" ? "/admin/dashboard" : "/account"
  const accountLabel = !isAuthenticated ? "Sign in" : role === "admin" ? "Admin Dashboard" : "Account"

  return (
    <header
      data-slot="navbar"
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-h3 font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="size-4 fill-primary-foreground" />
          </span>
          <span className="text-foreground">
            Baby<span className="text-primary">Nest</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-small font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/search"
            className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-ai-border bg-ai-muted px-3.5 py-2 text-small font-medium text-ai-muted-foreground transition-colors hover:bg-ai-muted/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ai/40"
          >
            <Sparkles className="size-3.5" />
            AI Smart Search
          </Link>
        </nav>

        <div className="flex items-center gap-0.5">
          <div className="hidden sm:flex sm:items-center sm:gap-0.5">
            <IconLink href="/search" label="Search" icon={Search} />
            <IconLink href="/wishlist" label="Wishlist" icon={Heart} count={wishlistCount} />
            <IconLink href="/cart" label="Cart" icon={ShoppingBag} count={cartCount} />
            <IconLink href={accountHref} label={accountLabel} icon={User} />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen ? (
        <div className="border-t border-border bg-background lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 text-body font-medium text-foreground hover:bg-muted"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/search"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-body font-medium text-ai-muted-foreground hover:bg-ai-muted"
            >
              <Sparkles className="size-4" />
              AI Smart Search
            </Link>
            <div className="my-1 h-px bg-border" />
            <Link
              href="/wishlist"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-body font-medium text-foreground hover:bg-muted"
            >
              Wishlist
              {wishlistCount > 0 ? (
                <span className="text-small text-muted-foreground">{wishlistCount}</span>
              ) : null}
            </Link>
            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-body font-medium text-foreground hover:bg-muted"
            >
              Cart
              {cartCount > 0 ? (
                <span className="text-small text-muted-foreground">{cartCount}</span>
              ) : null}
            </Link>
            <Link
              href={accountHref}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-body font-medium text-foreground hover:bg-muted"
            >
              {!isAuthenticated ? "Sign in" : role === "admin" ? "Admin Dashboard" : "My account"}
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  )
}

export { Navbar }
