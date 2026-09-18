import type { Metadata } from "next"
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"

export const metadata: Metadata = { title: "Dashboard" }

export default function AdminDashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Good morning, Admin</h1>
        <p className="text-body text-muted-foreground">
          Here&apos;s what&apos;s happening with your BabyNest store today.
        </p>
        <span className="mt-1 text-caption text-muted-foreground">{today}</span>
      </div>

      <AdminDashboardContent />
    </div>
  )
}
