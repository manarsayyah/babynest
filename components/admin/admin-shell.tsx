"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"

/** Persistent admin shell: fixed sidebar on desktop, a slide-over drawer on mobile/tablet. */
function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const pathname = usePathname()

  // Close the drawer on navigation — adjusting state during render (React's
  // recommended pattern) instead of an effect, so it takes effect in the
  // same commit rather than causing an extra render pass.
  const [lastPathname, setLastPathname] = React.useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar className="hidden w-64 shrink-0 border-r border-border lg:flex" />

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-foreground/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-card shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="absolute top-3 right-3 z-10 flex size-8 items-center justify-center rounded-full bg-muted text-foreground"
            >
              <X className="size-4" />
            </button>
            <AdminSidebar className="h-full" onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export { AdminShell }
