"use client"

import * as React from "react"
import { toast } from "sonner"
import { Download, TriangleAlert } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ReportFilters, type ReportFiltersValue } from "@/components/admin/reports/report-filters"
import { ReportKeyMetrics } from "@/components/admin/reports/report-key-metrics"
import { SalesPerformanceCard } from "@/components/admin/reports/sales-performance-card"
import { OrderOverviewCard } from "@/components/admin/reports/order-overview-card"
import { ProductPerformanceReportCard } from "@/components/admin/reports/product-performance-report-card"
import { CustomerPerformanceCard } from "@/components/admin/reports/customer-performance-card"
import { InventoryOverviewCard } from "@/components/admin/reports/inventory-overview-card"
import {
  fetchAdminReport,
  reportDateRangeOptions,
  reportOrderStatusLabel,
  reportTypeOptions,
  type AdminReport,
  type AdminReportQuery,
  type ReportOrderStatus,
} from "@/lib/api-client/admin-reports"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const defaultFilters: ReportFiltersValue = {
  dateRange: "30d",
  reportType: "all",
  category: "all",
  customStart: "",
  customEnd: "",
}

function errorMessage(err: unknown) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to view reports."
    if (err.status < 500) return err.message
  }
  return "Something went wrong. Please try again."
}

/** A custom range needs two real dates, start not after end — the API enforces the same rules. */
function customRangeError(filters: ReportFiltersValue): string | null {
  if (filters.dateRange !== "custom") return null
  if (!filters.customStart || !filters.customEnd) return "Choose both a start and an end date."
  if (filters.customStart > filters.customEnd) return "The start date can't be after the end date."
  return null
}

const csvCell = (value: string | number) => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Builds a CSV of exactly what the page is showing (key metrics + the sections the Report Type filter displays). */
function buildCsv(report: AdminReport, reportType: ReportFiltersValue["reportType"], rangeLabel: string, categoryLabel: string) {
  const rows: (string | number)[][] = []
  const section = (title: string, header: (string | number)[], body: (string | number)[][]) => {
    rows.push([title], header, ...body, [])
  }
  const show = (type: ReportFiltersValue["reportType"]) => reportType === "all" || reportType === type

  rows.push(["BabyNest report"], ["Period", rangeLabel], ["From (UTC, inclusive)", report.range.start], ["To (UTC, exclusive)", report.range.end], ["Category", categoryLabel], ["Generated", report.generatedAt], [])
  section("Key metrics", ["Metric", "Value"], [
    ["Revenue (non-cancelled orders)", report.metrics.revenue.toFixed(2)],
    ["Orders (all statuses)", report.metrics.orderCount],
    ["Average order value", report.metrics.averageOrderValue.toFixed(2)],
    ["Customers (with a non-cancelled order)", report.metrics.uniqueCustomers],
  ])
  if (show("sales")) section("Sales performance", ["Period", "Revenue"], report.salesSeries.map((point) => [point.label, point.value.toFixed(2)]))
  if (show("orders")) {
    section("Order overview", ["Status", "Orders"], (Object.keys(report.orderStatus) as ReportOrderStatus[]).map((status) => [reportOrderStatusLabel[status], report.orderStatus[status]]))
  }
  if (show("products")) {
    section("Top selling products", ["Product", "Units sold", "Revenue"], report.products.topSelling.map((p) => [p.name, p.unitsSold, p.revenue.toFixed(2)]))
    section("Lowest rated products", ["Product", "Rating", "Reviews"], report.products.lowestRated.map((p) => [p.name, p.rating.toFixed(1), p.reviewCount]))
  }
  if (show("customers")) {
    section("Customer performance", ["Metric", "Value"], [
      ["New customers (joined in period)", report.customers.newCustomers],
      ["Returning customers (2+ orders)", report.customers.returningCustomers],
      ["Total customers", report.customers.totalCustomers],
      ["Average customer spend (lifetime)", report.customers.averageCustomerSpend.toFixed(2)],
    ])
  }
  if (show("inventory")) {
    section("Inventory overview", ["Metric", "Value"], [
      ["Total products", report.inventory.total],
      ["Low stock products", report.inventory.lowStock.length],
      ["Out of stock products", report.inventory.outOfStock.length],
      ["Inventory value", report.inventory.inventoryValue.toFixed(2)],
    ])
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}

/** Admin Reports page: filters (draft/apply), key metrics, and the five report sections, all driven by real MongoDB data. */
function AdminReportsPageContent() {
  const [draftFilters, setDraftFilters] = React.useState<ReportFiltersValue>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<ReportFiltersValue>(defaultFilters)
  const [filterError, setFilterError] = React.useState<string | null>(null)

  const [data, setData] = React.useState<AdminReport | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  // Key of the last request that settled; while it differs from the current one, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)

  function handleApply() {
    const problem = customRangeError(draftFilters)
    setFilterError(problem)
    if (problem) return
    setAppliedFilters(draftFilters)
  }

  const query = React.useMemo<AdminReportQuery>(
    () => ({
      range: appliedFilters.dateRange,
      start: appliedFilters.customStart,
      end: appliedFilters.customEnd,
      categoryId: appliedFilters.category === "all" ? undefined : appliedFilters.category,
    }),
    [appliedFilters]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminReport(query, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setLoadError(null)
        setSettledKey(key)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err))
        setSettledKey(key)
      })

    return () => controller.abort()
  }, [query, reloadToken])

  const categoryOptions = React.useMemo(
    () => (data?.categoryOptions ?? []).map((category) => ({ value: category._id, label: category.name })),
    [data?.categoryOptions]
  )

  function handleExport() {
    if (!data) return
    const rangeLabel = reportDateRangeOptions.find((o) => o.value === appliedFilters.dateRange)?.label ?? "Report"
    const categoryLabel = categoryOptions.find((o) => o.value === appliedFilters.category)?.label ?? "All Categories"
    const csv = buildCsv(data, appliedFilters.reportType, rangeLabel, categoryLabel)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `babynest-report-${appliedFilters.dateRange}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    const reportLabel = reportTypeOptions.find((o) => o.value === appliedFilters.reportType)?.label ?? "Report"
    toast.success("Report exported", { description: `${reportLabel} for ${rangeLabel.toLowerCase()} saved as CSV.` })
  }

  const showSection = (type: ReportFiltersValue["reportType"]) =>
    appliedFilters.reportType === "all" || appliedFilters.reportType === type

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-foreground">Reports</h1>
          <p className="text-body text-muted-foreground">Analyze your store performance and generate detailed reports</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!data || isFetching} className="w-full sm:w-auto">
          <Download data-icon="inline-start" />
          Export Report
        </Button>
      </div>

      <ReportFilters
        value={draftFilters}
        categoryOptions={categoryOptions}
        error={filterError}
        onChange={setDraftFilters}
        onApply={handleApply}
      />

      {loadError && !data ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load reports"
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
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
          <Card className="p-5">
            <Skeleton className="h-64 w-full rounded-lg" />
          </Card>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className={cn("flex flex-col gap-6 transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
          {loadError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't refresh the report"
              description={`${loadError} Showing the last loaded data.`}
              action={
                <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          ) : null}

          <ReportKeyMetrics metrics={data.metrics} changes={data.changes} />

          {showSection("sales") ? (
            <SalesPerformanceCard
              data={data.salesSeries}
              revenue={data.metrics.revenue}
              changePercent={data.changes.revenue}
            />
          ) : null}

          {showSection("orders") ? (
            <OrderOverviewCard breakdown={data.orderStatus} totalOrders={data.totalOrders} />
          ) : null}

          {showSection("products") ? (
            <ProductPerformanceReportCard
              topProducts={data.products.topSelling}
              lowestProducts={data.products.lowestRated}
            />
          ) : null}

          {showSection("customers") ? <CustomerPerformanceCard report={data.customers} /> : null}

          {showSection("inventory") ? (
            <InventoryOverviewCard
              total={data.inventory.total}
              outOfStock={data.inventory.outOfStock}
              lowStock={data.inventory.lowStock}
              inventoryValue={data.inventory.inventoryValue}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}

export { AdminReportsPageContent }
