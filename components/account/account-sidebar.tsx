"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  Bell,
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Settings,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"
import type { AccountProfile } from "@/lib/mock/account"

const navItems = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/personal-info", label: "Personal Information", icon: User },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/addresses", label: "Addresses", icon: MapPin },
  { href: "/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/account/ai-preferences", label: "AI Preferences", icon: Sparkles, accent: true },
  { href: "/account/settings", label: "Settings", icon: Settings },
]

export type AccountSidebarProps = {
  profile: AccountProfile
  className?: string
}

/** "My Orders" also covers the order detail route (`/orders/[id]`), which lives outside `/account` but is still part of this section. */
function isNavItemActive(pathname: string | null, href: string) {
  if (pathname === href) return true
  if (href === "/account/orders" && pathname?.startsWith("/orders/")) return true
  return false
}

/** Left account navigation — avatar/name, section links (Overview active), Sign Out. */
function AccountSidebar({ profile, className }: AccountSidebarProps) {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Prefer the real signed-in user's name/email once the session has loaded
  // client-side — `profile` mock data is only a fallback during the brief
  // "loading" status right after mount (proxy.ts already guarantees a
  // session exists server-side before this page is reachable). The avatar
  // itself always comes from `profile`, since sessions don't carry one.
  const displayFirstName = status === "authenticated" ? session.user.firstName : profile.firstName
  const displayLastName = status === "authenticated" ? session.user.lastName : profile.lastName
  const displayEmail = status === "authenticated" ? session.user.email : profile.email

  return (
    <Card className={cn("flex flex-col gap-6 p-5", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar}
          alt={`${displayFirstName} ${displayLastName}`}
          className="size-16 rounded-full object-cover ring-1 ring-foreground/10"
        />
        <div>
          <p className="text-small font-semibold text-foreground">
            {displayFirstName} {displayLastName}
          </p>
          <p className="text-caption text-muted-foreground">{displayEmail}</p>
        </div>
      </div>

      <nav aria-label="Account" className="flex flex-col gap-1">
        <span className="px-3 pb-1 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </span>
        {navItems.map((item) => {
          const isActive = isNavItemActive(pathname, item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-small font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/80 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {item.accent ? <Sparkles className="ml-auto size-3 text-ai" /> : null}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ redirectTo: "/" })}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-small font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
      >
        <LogOut className="size-4" />
        Sign Out
      </button>
    </Card>
  )
}

export { AccountSidebar }
