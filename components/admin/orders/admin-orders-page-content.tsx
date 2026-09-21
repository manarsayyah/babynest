"use client"

import * as React from "react"
import { toast } from "sonner"
import { Download, PackageSearch, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { OrdersSummaryCards } from "@/components/admin/orders/orders-summary-cards"
import {
  OrdersToolbar,
  type DateRangeFilter,
  type OrderSortKey,
  type OrderStatusFilter,
  type PaymentStatusFilter,
} from "@/components/admin/orders/orders-toolbar"
import { OrdersTable } from "@/components/admin/orders/orders-table"
import { CancelOrderDialog } from "@/components/admin/orders/cancel-order-dialog"
import { OrderDetailDialog } from "@/components/admin/orders/order-detail-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import {
  fetchAdminOrders,
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
  updateAdminOrderStatus,
  type AdminOrderListResponse,
  type AdminOrderQuery,
  type AdminOrderRow,
  type AdminOrderStatus,
} from "@/lib/api-client/admin-orders"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const PAGE_SIZE = 8
const SEARCH_DEBOUNCE_MS = 300
const EXPORT_PAGE_SIZE = 100

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage orders."
    if (err.status === 404) return "This order no longer exists."
    if (err.status < 500) return err.message
  }
  return fallback
}

function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Admin Orders page: header, summary tiles, toolbar, table/cards, pagination — all backed by the real Orders API. */
function AdminOrdersPageContent() {
  const [data, setData] = React.useState<AdminOrderListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [orderStatus, setOrderStatus] = React.useState<OrderStatusFilter>("all")
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatusFilter>("all")
  const [dateRange, setDateRange] = React.useState<DateRangeFilter>("all")
  const [sort, setSort] = React.useState<OrderSortKey>("newest")
  const [page, setPage] = React.useState(1)

  const [orderToView, setOrderToView] = React.useState<AdminOrderRow | null>(null)
  const [orderToCancel, setOrderToCancel] = React.useState<AdminOrderRow | null>(null)
  const [busyOrderId, setBusyOrderId] = React.useState<string | null>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  const hasActiveFilters =
    search.trim().length > 0 || orderStatus !== "all" || paymentStatus !== "all" || dateRange !== "all"

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  function handleClearFilters() {
    setSearch("")
    setDebouncedSearch("")
    setOrderStatus("all")
    setPaymentStatus("all")
    setDateRange("all")
    setPage(1)
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  // Everything except page/limit — shared by the table query and the CSV export.
  const filters = React.useMemo<AdminOrderQuery>(
    () => ({
      search: debouncedSearch,
      status: orderStatus === "all" ? undefined : orderStatus,
      paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
      dateRange: dateRange === "all" ? undefined : dateRange,
      sort,
    }),
    [debouncedSearch, orderStatus, paymentStatus, dateRange, sort]
  )
  const query = React.useMemo<AdminOrderQuery>(() => ({ ...filters, page, limit: PAGE_SIZE }), [filters, page])
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminOrders(query, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setLoadError(null)
        setSettledKey(key)
        // The last row of the last page was removed — step back to a page that exists.
        if (result.items.length === 0 && result.total > 0 && (query.page ?? 1) > result.totalPages) {
          setPage(result.totalPages)
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
        setSettledKey(key)
      })

    return () => controller.abort()
  }, [query, reloadToken])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, (currentPage - 1) * PAGE_SIZE + items.length)

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows: AdminOrderRow[] = []
      for (let exportPage = 1; ; exportPage++) {
        const result = await fetchAdminOrders({ ...filters, page: exportPage, limit: EXPORT_PAGE_SIZE })
        rows.push(...result.items)
        if (exportPage >= result.totalPages) break
      }
      if (rows.length === 0) {
        toast("Nothing to export", { description: "No orders match the current filters." })
        return
      }

      const header = ["Order", "Customer", "Email", "Date", "Items", "Subtotal", "Discount", "Shipping", "Total", "Payment", "Status"]
      const lines = rows.map((order) =>
        [
          order.orderNumber,
          order.customer?.name ?? "",
          order.customer?.email ?? "",
          formatOrderDate(order.createdAt),
          order.totalQuantity,
          order.subtotal.toFixed(2),
          order.discount.toFixed(2),
          order.shippingCost.toFixed(2),
          order.total.toFixed(2),
          order.payment ? paymentStatusLabel[order.payment.status] : "",
          orderStatusLabel[order.status],
        ]
          .map(csvCell)
          .join(",")
      )
      const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `babynest-orders-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Orders exported", { description: `${rows.length} ${rows.length === 1 ? "order" : "orders"} saved to CSV.` })
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't export orders. Please try again."))
    } finally {
      setIsExporting(false)
    }
  }

  async function handleUpdateStatus(order: AdminOrderRow, status: AdminOrderStatus) {
    if (status === order.status) return
    setBusyOrderId(order._id)
    try {
      await updateAdminOrderStatus(order._id, status)
      toast.success("Order status updated", { description: `${order.orderNumber} is now ${orderStatusLabel[status]}.` })
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the order status. Please try again."))
    } finally {
      setBusyOrderId(null)
      reload()
    }
  }

  async function handleCancelConfirm(order: AdminOrderRow) {
    try {
      await updateAdminOrderStatus(order._id, "cancelled", "Cancelled by admin")
      toast.success("Order cancelled", { description: `${order.orderNumber} has been cancelled.` })
      setOrderToCancel(null)
    } catch (err) {
      // A 404 means it's already gone — close the dialog and let the refresh show that.
      if (err instanceof ApiRequestError && err.status === 404) setOrderToCancel(null)
      toast.error(errorMessage(err, "Couldn't cancel the order. Please try again."))
    }
    reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-admin-title text-foreground">Orders</h1>
          <p className="text-body text-muted-foreground">Manage and track customer orders</p>
        </div>
        <Button variant="outline" onClick={() => void handleExport()} disabled={isExporting} className="w-full sm:w-auto">
          <Download data-icon="inline-start" />
          {isExporting ? "Exporting..." : "Export Orders"}
        </Button>
      </div>

      <OrdersSummaryCards summary={data?.summary ?? null} />

      <Card className="p-5">
        <OrdersToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          orderStatus={orderStatus}
          onOrderStatusChange={resetToFirstPage(setOrderStatus)}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={resetToFirstPage(setPaymentStatus)}
          dateRange={dateRange}
          onDateRangeChange={resetToFirstPage(setDateRange)}
          sort={sort}
          onSortChange={resetToFirstPage(setSort)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load orders"
          description={loadError}
          action={
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : data === null ? (
        <Card className="p-5">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      ) : items.length > 0 ? (
        <Card className="p-0">
          <div className={isFetching ? "p-5 opacity-60 transition-opacity" : "p-5 transition-opacity"} aria-busy={isFetching}>
            <OrdersTable
              orders={items}
              onView={setOrderToView}
              onUpdateStatus={(order, status) => void handleUpdateStatus(order, status)}
              onCancel={setOrderToCancel}
              busyOrderId={busyOrderId}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} {total === 1 ? "order" : "orders"}
            </p>
            <ProductsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="No orders found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "New customer orders will show up here as they come in."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      <OrderDetailDialog order={orderToView} onClose={() => setOrderToView(null)} onChanged={reload} />

      <CancelOrderDialog
        order={orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}

export { AdminOrdersPageContent }
