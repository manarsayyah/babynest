"use client"

import * as React from "react"
import { toast } from "sonner"
import { RefreshCw, TriangleAlert } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { AIBadge } from "@/components/ai/ai-badge"
import { InsightsSummaryCards } from "@/components/admin/ai-insights/insights-summary-cards"
import { SalesInsightsCard } from "@/components/admin/ai-insights/sales-insights-card"
import { ProductPerformanceCard } from "@/components/admin/ai-insights/product-performance-card"
import { InventoryInsightsCard } from "@/components/admin/ai-insights/inventory-insights-card"
import { CustomerInsightsCard } from "@/components/admin/ai-insights/customer-insights-card"
import { AIRecommendationsSection } from "@/components/admin/ai-insights/ai-recommendations-section"
import { fetchAdminInsights, type AdminInsights, type InsightsPeriod } from "@/lib/api-client/admin-insights"
import { ApiRequestError } from "@/lib/api-client/fetcher"

function errorMessage(err: unknown) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to view store insights."
    if (err.status < 500) return err.message
  }
  return "Something went wrong. Please try again."
}

function formatUpdated(iso: string) {
  const date = new Date(iso)
  const isToday = date.toDateString() === new Date().toDateString()
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${isToday ? "Today" : day}, ${time}`
}

/** Admin AI Insights page: header, summary tiles, sales/product/inventory/customer insight cards, recommendations — all from real store data. */
function AdminAIInsightsPageContent() {
  const [data, setData] = React.useState<AdminInsights | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState<InsightsPeriod>("30d")
  const [reloadToken, setReloadToken] = React.useState(0)
  // Key of the last request that settled; while it differs from the current one, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [manualRefresh, setManualRefresh] = React.useState(false)
  // Whether the in-flight request came from the Refresh button (so exactly one toast is shown when it settles).
  const manualRef = React.useRef(false)

  const requestKey = `${period}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${period}#${reloadToken}`

    fetchAdminInsights(period, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setLoadError(null)
        setSettledKey(key)
        if (manualRef.current) {
          manualRef.current = false
          setManualRefresh(false)
          toast.success("Insights refreshed", { description: "Recalculated from your latest store data." })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err))
        setSettledKey(key)
        if (manualRef.current) {
          manualRef.current = false
          setManualRefresh(false)
          toast.error("Couldn't refresh insights. Please try again.")
        }
      })

    return () => controller.abort()
  }, [period, reloadToken])

  function handleRefresh() {
    manualRef.current = true
    setManualRefresh(true)
    setReloadToken((n) => n + 1)
  }

  const isRefreshing = manualRefresh && isFetching

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h1 text-foreground">AI Insights</h1>
            <AIBadge label="Live store data" />
          </div>
          <p className="text-body text-muted-foreground">Smart insights and recommendations for your BabyNest store</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-caption text-muted-foreground">
            {data ? `Last updated: ${formatUpdated(data.generatedAt)}` : "Loading..."}
          </span>
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw data-icon="inline-start" className={cn(isFetching && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh Insights"}
          </Button>
        </div>
      </div>

      {loadError && !data ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load insights"
          description={loadError}
          action={
            <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
              Try again
            </Button>
          }
        />
      ) : data === null ? (
        <div className="flex flex-col gap-6" aria-busy="true">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <Card className="p-5">
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {loadError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't refresh insights"
              description={`${loadError} Showing the last loaded data.`}
              action={
                <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          ) : null}

          <InsightsSummaryCards summary={data.summary} />

          <SalesInsightsCard sales={data.sales} period={period} onPeriodChange={setPeriod} isLoading={isFetching} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ProductPerformanceCard products={data.products} />
            <InventoryInsightsCard inventory={data.inventory} />
          </div>

          <CustomerInsightsCard customers={data.customers} />

          <AIRecommendationsSection recommendations={data.recommendations} />
        </>
      )}
    </div>
  )
}

export { AdminAIInsightsPageContent }
