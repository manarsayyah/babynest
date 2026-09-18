"use client"

import * as React from "react"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReportFilters, type ReportFiltersValue } from "@/components/admin/reports/report-filters"
import { ReportKeyMetrics } from "@/components/admin/reports/report-key-metrics"
import { SalesPerformanceCard } from "@/components/admin/reports/sales-performance-card"
import { OrderOverviewCard } from "@/components/admin/reports/order-overview-card"
import { ProductPerformanceReportCard } from "@/components/admin/reports/product-performance-report-card"
import { CustomerPerformanceCard } from "@/components/admin/reports/customer-performance-card"
import { InventoryOverviewCard } from "@/components/admin/reports/inventory-overview-card"
import { adminOrders } from "@/lib/mock/admin-orders"
import {
  buildSalesSeries,
  computeReportMetrics,
  filterOrdersByRange,
  getCustomerReport,
  getInventoryOverview,
  getLowestPerformingProducts,
  getOrderStatusBreakdown,
  getPreviousRange,
  getTopPerformingProducts,
  percentChange,
  reportTypeOptions,
  resolveDateRange,
} from "@/lib/mock/admin-reports"

const defaultFilters: ReportFiltersValue = {
  dateRange: "30d",
  reportType: "all",
  category: "all",
  customStart: "",
  customEnd: "",
}

/** Admin Reports page: filters (draft/apply), key metrics, and the five report sections, all driven by real order/product/customer data. */
function AdminReportsPageContent() {
  const [draftFilters, setDraftFilters] = React.useState<ReportFiltersValue>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = React.useState<ReportFiltersValue>(defaultFilters)

  function handleApply() {
    setAppliedFilters(draftFilters)
  }

  function handleExport() {
    const reportLabel = reportTypeOptions.find((o) => o.value === appliedFilters.reportType)?.label ?? "Report"
    toast(`Export isn't wired up yet`, {
      description: `No file was downloaded — this is a frontend-only demo of the ${reportLabel} export.`,
    })
  }

  const range = React.useMemo(
    () =>
      resolveDateRange(appliedFilters.dateRange, {
        start: appliedFilters.customStart,
        end: appliedFilters.customEnd,
      }),
    [appliedFilters.dateRange, appliedFilters.customStart, appliedFilters.customEnd]
  )

  const filteredOrders = React.useMemo(() => filterOrdersByRange(adminOrders, range), [range])
  const metrics = React.useMemo(() => computeReportMetrics(filteredOrders), [filteredOrders])

  const previousRange = React.useMemo(() => getPreviousRange(range), [range])
  const previousOrders = React.useMemo(() => filterOrdersByRange(adminOrders, previousRange), [previousRange])
  const previousMetrics = React.useMemo(() => computeReportMetrics(previousOrders), [previousOrders])

  const changes = {
    revenue: percentChange(metrics.revenue, previousMetrics.revenue),
    orderCount: percentChange(metrics.orderCount, previousMetrics.orderCount),
    averageOrderValue: percentChange(metrics.averageOrderValue, previousMetrics.averageOrderValue),
    uniqueCustomers: percentChange(metrics.uniqueCustomers, previousMetrics.uniqueCustomers),
  }

  const salesSeries = React.useMemo(() => buildSalesSeries(filteredOrders, range), [filteredOrders, range])
  const statusBreakdown = React.useMemo(() => getOrderStatusBreakdown(filteredOrders), [filteredOrders])

  const categorySlug = appliedFilters.category === "all" ? null : appliedFilters.category
  const topProducts = React.useMemo(() => getTopPerformingProducts(categorySlug), [categorySlug])
  const lowestProducts = React.useMemo(() => getLowestPerformingProducts(categorySlug), [categorySlug])
  const inventoryOverview = React.useMemo(() => getInventoryOverview(categorySlug), [categorySlug])
  const customerReport = React.useMemo(() => getCustomerReport(range), [range])

  const showSection = (type: ReportFiltersValue["reportType"]) =>
    appliedFilters.reportType === "all" || appliedFilters.reportType === type

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-foreground">Reports</h1>
          <p className="text-body text-muted-foreground">Analyze your store performance and generate detailed reports</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
          <Download data-icon="inline-start" />
          Export Report
        </Button>
      </div>

      <ReportFilters value={draftFilters} onChange={setDraftFilters} onApply={handleApply} />

      <ReportKeyMetrics metrics={metrics} changes={changes} />

      {showSection("sales") ? (
        <SalesPerformanceCard data={salesSeries} revenue={metrics.revenue} changePercent={changes.revenue} />
      ) : null}

      {showSection("orders") ? (
        <OrderOverviewCard breakdown={statusBreakdown} totalOrders={filteredOrders.length} />
      ) : null}

      {showSection("products") ? (
        <ProductPerformanceReportCard topProducts={topProducts} lowestProducts={lowestProducts} />
      ) : null}

      {showSection("customers") ? <CustomerPerformanceCard report={customerReport} /> : null}

      {showSection("inventory") ? (
        <InventoryOverviewCard
          total={inventoryOverview.total}
          outOfStock={inventoryOverview.outOfStock}
          lowStock={inventoryOverview.lowStock}
          inventoryValue={inventoryOverview.inventoryValue}
        />
      ) : null}
    </div>
  )
}

export { AdminReportsPageContent }
