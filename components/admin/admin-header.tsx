"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Bell, ChevronDown, ChevronRight, LogOut, Menu, Search, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Products",
  orders: "Orders",
  customers: "Customers",
  categories: "Categories",
  reviews: "Reviews",
  "ai-insights": "AI Insights",
  reports: "Reports",
  settings: "Settings",
}

function useAdminBreadcrumb() {
  const pathname = usePathname() ?? "/admin/dashboard"
  const segments = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean)
  if (segments.length === 0) return [{ label: "Dashboard" }]
  return segments.map((segment) => ({ label: SEGMENT_LABELS[segment] ?? decodeURIComponent(segment) }))
}

/** Minimal top bar: breadcrumb, search, notifications, admin avatar dropdown, and the mobile menu trigger. */
function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const crumbs = useAdminBreadcrumb()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-backdrop-filter:bg-card/80 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-small sm:flex">
        {crumbs.map((crumb, index) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="size-3.5 text-muted-foreground" /> : null}
            <span
              className={
                index === crumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-9 w-48 rounded-full pl-9 lg:w-64"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                toast("Admin search isn't wired up yet", { description: "This is a frontend-only demo." })
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => toast("You're all caught up", { description: "No new notifications." })}
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
        >
          <Bell className="size-[18px]" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-full py-1 pr-1.5 pl-1 hover:bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://placehold.co/80x80/FCE4E8/DB5E76?font=roboto&text=A"
              alt="Admin"
              className="size-7 rounded-full object-cover ring-1 ring-foreground/10"
            />
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Admin account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/admin/settings" />}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => signOut({ redirectTo: "/" })}>
                <LogOut className="size-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { AdminHeader }
