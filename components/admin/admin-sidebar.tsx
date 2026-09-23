"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  BarChart3,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Undo2,
  Users,
  FolderTree,
} from "lucide-react"
import { cn } from "cn"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/returns", label: "Returns", icon: Undo2 },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/ai-insights", label: "AI Insights", icon: Sparkles, accent: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export type AdminSidebarProps = {
  className?: string
  onNavigate?: () => void
}

/** BabyNest admin nav — same warm/cream surface as the rest of the site, never a dark dev-dashboard sidebar. */
function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      <div className="flex flex-col gap-0.5 px-5 pt-6 pb-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-h3 font-extrabold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="size-4 fill-primary-foreground" />
          </span>
          <span className="text-foreground">
            Baby<span className="text-primary">Nest</span>
          </span>
        </Link>
        <span className="pl-10 text-caption text-muted-foreground">Admin Portal</span>
      </div>

      <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-small font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
              {item.accent ? <Sparkles className="ml-auto size-3 text-ai" /> : null}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border p-4">
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/avatars/avatar-rose.svg"
            alt="Admin"
            className="size-9 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-small font-semibold text-foreground">Admin</span>
            <span className="truncate text-caption text-muted-foreground">Administrator</span>
          </div>
          <Link
            href="/admin/settings"
            aria-label="Settings"
            className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
        </div>
        <button
          type="button"
          onClick={() => signOut({ redirectTo: "/" })}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-small font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </div>
  )
}

export { AdminSidebar }
