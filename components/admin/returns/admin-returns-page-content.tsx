"use client"

import * as React from "react"
import { toast } from "sonner"
import { SearchX, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ReturnsSummaryCards } from "@/components/admin/returns/returns-summary-cards"
import { ReturnsToolbar, type ReturnStatusFilter } from "@/components/admin/returns/returns-toolbar"
import { ReturnsTable, type ReturnOrderInfo } from "@/components/admin/returns/returns-table"
import { ReturnDetailDialog } from "@/components/admin/returns/return-detail-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import {
  fetchAdminReturns,
  fetchAdminReturnsSummary,
  returnStatusLabel,
  updateAdminReturnStatus,
  type AdminReturnListResponse,
  type AdminReturnQuery,
  type AdminReturnRow,
  type AdminReturnSummary,
  type ReturnStatus,
} from "@/lib/api-client/admin-returns"
import { fetchAdminOrderDetail } from "@/lib/api-client/admin-orders"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const PAGE_SIZE = 8

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage returns."
    if (err.status === 404) return "This return request no longer exists."
    if (err.status < 500) return err.message
  }
  return fallback
}

/** Admin Returns page: header, summary tiles, status filter, table/cards, pagination, detail dialog — all backed by the real Returns API. */
function AdminReturnsPageContent() {
  const [data, setData] = React.useState<AdminReturnListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [summary, setSummary] = React.useState<AdminReturnSummary | null>(null)

  const [status, setStatus] = React.useState<ReturnStatusFilter>("all")
  const [page, setPage] = React.useState(1)

  const [orderInfoByOrderId, setOrderInfoByOrderId] = React.useState<Record<string, ReturnOrderInfo | null>>({})

  const [selectedReturn, setSelectedReturn] = React.useState<AdminReturnRow | null>(null)
  const [busyReturnId, setBusyReturnId] = React.useState<string | null>(null)

  const hasActiveFilters = status !== "all"

  function handleClearFilters() {
    setStatus("all")
    setPage(1)
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  const query = React.useMemo<AdminReturnQuery>(
    () => ({ page, limit: PAGE_SIZE, status: status === "all" ? undefined : status }),
    [page, status]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminReturns(query, { signal: controller.signal })
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

  // Summary tiles are independent of the toolbar's filters/pagination (same split as OrdersSummaryCards).
  React.useEffect(() => {
    let cancelled = false
    fetchAdminReturnsSummary()
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .catch(() => {
        // Non-fatal: the table still loads; the tiles just stay blank.
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  // The returns list endpoint doesn't join order/customer — enrich the current page's rows with one
  // GET /api/admin/orders/[id] call per unique order (existing endpoint, no backend change needed).
  React.useEffect(() => {
    const items = data?.items ?? []
    const orderIds = Array.from(new Set(items.map((r) => r.orderId)))
    if (orderIds.length === 0) return

    let cancelled = false
    Promise.all(
      orderIds.map((orderId) =>
        fetchAdminOrderDetail(orderId)
          .then((detail) => [orderId, detail] as const)
          .catch(() => [orderId, null] as const)
      )
    )
      .then((results) => {
        if (cancelled) return
        setOrderInfoByOrderId((prev) => {
          const next = { ...prev }
          for (const [orderId, detail] of results) {
            next[orderId] = detail
              ? {
                  orderNumber: detail.order.orderNumber,
                  customerName: detail.customer ? `${detail.customer.firstName} ${detail.customer.lastName}` : "Unknown customer",
                  customerEmail: detail.customer?.email ?? "",
                }
              : null
          }
          return next
        })
      })

    return () => {
      cancelled = true
    }
  }, [data])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, (currentPage - 1) * PAGE_SIZE + items.length)

  async function handleUpdateStatus(returnRow: AdminReturnRow, nextStatus: ReturnStatus) {
    setBusyReturnId(returnRow._id)
    try {
      await updateAdminReturnStatus(returnRow._id, nextStatus)
      toast.success("Return updated", { description: `This request is now "${returnStatusLabel[nextStatus]}".` })
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the return. Please try again."))
    } finally {
      setBusyReturnId(null)
      reload()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-admin-title text-foreground">Returns</h1>
        <p className="text-body text-muted-foreground">Review and process customer return requests</p>
      </div>

      <ReturnsSummaryCards summary={summary} />

      <Card className="p-5">
        <ReturnsToolbar
          status={status}
          onStatusChange={(value) => {
            setStatus(value)
            setPage(1)
          }}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load returns"
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
            <ReturnsTable
              returns={items}
              orderInfoByOrderId={orderInfoByOrderId}
              onView={setSelectedReturn}
              onUpdateStatus={(returnRow, nextStatus) => void handleUpdateStatus(returnRow, nextStatus)}
              busyReturnId={busyReturnId}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} {total === 1 ? "return" : "returns"}
            </p>
            <ProductsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No return requests found"
          description={hasActiveFilters ? "Try a different status filter." : "No customer has requested a return yet."}
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      <ReturnDetailDialog returnRow={selectedReturn} onClose={() => setSelectedReturn(null)} onChanged={reload} />
    </div>
  )
}

export { AdminReturnsPageContent }
