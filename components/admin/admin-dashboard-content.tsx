"use client"

import * as React from "react"
import { DollarSign, Package, ShoppingBag, TriangleAlert, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { StatCard } from "@/components/admin/stat-card"
import { SalesOverviewCard } from "@/components/admin/sales-overview-card"
import { RecentOrdersPreviewCard } from "@/components/admin/recent-orders-preview-card"
import { TopProductsCard } from "@/components/admin/top-products-card"
import { DashboardAIInsightsCard } from "@/components/admin/dashboard-ai-insights-card"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { fetchAdminDashboard, type AdminDashboardData } from "@/lib/api-client/admin-dashboard"

function trend(change: number | null) {
  if (change === null) return {}
  return {
    trendLabel: `${change >= 0 ? "+" : ""}${change}% vs previous 30 days`,
    trendDirection: change >= 0 ? ("up" as const) : ("down" as const),
  }
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/** The dashboard's KPI row and panels, backed by the real, admin-only GET /api/admin/dashboard. */
function AdminDashboardContent() {
  const [data, setData] = React.useState<AdminDashboardData | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchAdminDashboard()
        if (cancelled) return
        setData(result)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setData(null)
        setError(
          err instanceof ApiRequestError && (err.status === 401 || err.status === 403)
            ? "You don't have access to the admin dashboard. Please sign in with an admin account."
            : "Couldn't load the dashboard data. Please try again."
        )
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  if (error) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Couldn't load the dashboard"
        description={error}
        action={
          <Button
            variant="outline"
            onClick={() => {
              setError(null)
              setReloadToken((n) => n + 1)
            }}
          >
            Try again
          </Button>
        }
      />
    )
  }

  if (!data) return <DashboardSkeleton />

  const { stats } = data

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={DollarSign}
          label="Total Sales"
          value={`$${stats.totalSales.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
          tone="primary"
          {...trend(stats.trends.sales)}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={stats.orders.toLocaleString("en-US")}
          tone="ai"
          {...trend(stats.trends.orders)}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={stats.customers.toLocaleString("en-US")}
          tone="success"
          {...trend(stats.trends.customers)}
        />
        <StatCard icon={Package} label="Products" value={stats.products.toLocaleString("en-US")} tone="warning" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <div className="flex flex-col gap-6">
          <SalesOverviewCard series={data.salesSeries} />
          <RecentOrdersPreviewCard orders={data.recentOrders} />
        </div>
        <div className="flex flex-col gap-6">
          <TopProductsCard products={data.topProducts} />
          <DashboardAIInsightsCard highlights={data.highlights} />
        </div>
      </div>
    </>
  )
}

export { AdminDashboardContent }
