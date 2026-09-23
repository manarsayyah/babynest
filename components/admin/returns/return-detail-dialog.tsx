"use client"

import * as React from "react"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAdminOrderDetail, type AdminOrderDetail } from "@/lib/api-client/admin-orders"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { formatPrice } from "@/lib/format"
import {
  fetchAdminReturnDetail,
  formatReturnDateTime,
  nextReturnStatuses,
  returnStatusLabel,
  updateAdminReturnStatus,
  type AdminReturnDetail,
  type AdminReturnRow,
  type ReturnStatus,
} from "@/lib/api-client/admin-returns"

export type ReturnDetailDialogProps = {
  returnRow: AdminReturnRow | null
  onClose: () => void
  /** Called after a status change so the table behind the dialog can refresh. */
  onChanged: () => void
}

const statusBadgeVariant: Record<ReturnStatus, "warning" | "ai" | "success" | "destructive"> = {
  requested: "warning",
  approved: "ai",
  completed: "success",
  rejected: "destructive",
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage returns."
    if (err.status === 404) return "This return request no longer exists."
    if (err.status < 500) return err.message
  }
  return fallback
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-h4 text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-small">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right text-foreground">{children}</span>
    </div>
  )
}

function ReturnDetailBody({
  detail,
  order,
  reload,
}: {
  detail: AdminReturnDetail
  order: AdminOrderDetail | null
  reload: () => Promise<void>
}) {
  const [saving, setSaving] = React.useState<ReturnStatus | null>(null)
  const { return: returnDoc, items } = detail
  const nextStatuses = nextReturnStatuses(returnDoc.status)

  const orderItemsById = new Map((order?.items ?? []).map((item) => [item._id, item]))

  async function handleStatusChange(status: ReturnStatus) {
    setSaving(status)
    try {
      await updateAdminReturnStatus(returnDoc._id, status)
      toast.success("Return updated", { description: `This request is now "${returnStatusLabel[status]}".` })
      await reload()
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the return. Please try again."))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Section title="Request">
        <Row label="Requested">{formatReturnDateTime(returnDoc.requestedAt)}</Row>
        <Row label="Reason">
          <span className="max-w-64 text-left">{returnDoc.reason}</span>
        </Row>
      </Section>

      <Section title="Customer">
        {order?.customer ? (
          <>
            <Row label="Name">
              {order.customer.firstName} {order.customer.lastName}
            </Row>
            <Row label="Email">{order.customer.email}</Row>
          </>
        ) : (
          <p className="text-small text-muted-foreground">Customer details are unavailable.</p>
        )}
      </Section>

      <Section title="Order">
        <Row label="Order number">{detail.order?.orderNumber ?? order?.order.orderNumber ?? "—"}</Row>
        <Row label="Order status">{order ? order.order.status : (detail.order?.status ?? "—")}</Row>
      </Section>

      <Section title={`Items (${items.length})`}>
        <div className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const orderItem = orderItemsById.get(item.orderItemId)
            return (
              <div key={item._id} className="flex items-center justify-between gap-3 py-2.5 text-small">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{orderItem?.product?.name ?? "Product no longer available"}</p>
                  <p className="text-caption text-muted-foreground">
                    Qty {item.quantity}
                    {item.condition ? ` · ${item.condition}` : ""}
                  </p>
                </div>
                {orderItem ? <span className="shrink-0 text-foreground">{formatPrice(orderItem.unitPrice)}</span> : null}
              </div>
            )
          })}
        </div>
      </Section>

      {nextStatuses.length > 0 ? (
        <Section title="Update Status">
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === "rejected" ? "outline" : "default"}
                className={status === "rejected" ? "border-destructive/40 text-destructive hover:bg-destructive/10" : undefined}
                disabled={saving !== null}
                onClick={() => void handleStatusChange(status)}
              >
                {saving === status ? "Saving..." : `Mark as ${returnStatusLabel[status]}`}
              </Button>
            ))}
          </div>
        </Section>
      ) : (
        <p className="text-caption text-muted-foreground">
          This return is {returnStatusLabel[returnDoc.status].toLowerCase()} — no further status changes are possible.
        </p>
      )}
    </div>
  )
}

function ReturnDetailLoader({ returnRow, onClose, onChanged }: { returnRow: AdminReturnRow; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = React.useState<AdminReturnDetail | null>(null)
  const [order, setOrder] = React.useState<AdminOrderDetail | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    fetchAdminReturnDetail(returnRow._id)
      .then((returnDetail) => {
        if (cancelled) return
        setDetail(returnDetail)
        setLoadError(null)
        // Non-fatal if this second call fails: the return itself still renders with what
        // GET /api/admin/returns/[id] already gave us.
        fetchAdminOrderDetail(returnDetail.return.orderId)
          .then((orderDetail) => {
            if (!cancelled) setOrder(orderDetail)
          })
          .catch(() => {
            if (!cancelled) setOrder(null)
          })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
      })

    return () => {
      cancelled = true
    }
  }, [returnRow._id, reloadToken])

  // Re-read the return after a status change, and let the table refresh too.
  const reload = React.useCallback(async () => {
    try {
      const returnDetail = await fetchAdminReturnDetail(returnRow._id)
      setDetail(returnDetail)
      setOrder(await fetchAdminOrderDetail(returnDetail.return.orderId).catch(() => null))
    } catch (err) {
      setLoadError(errorMessage(err, "Something went wrong. Please try again."))
    }
    onChanged()
  }, [returnRow._id, onChanged])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Return {returnRow._id.slice(-8).toUpperCase()}</DialogTitle>
        <DialogDescription className="flex items-center gap-2">
          Requested {formatReturnDateTime(returnRow.requestedAt)}
          <Badge variant={statusBadgeVariant[detail?.return.status ?? returnRow.status]}>
            {returnStatusLabel[detail?.return.status ?? returnRow.status]}
          </Badge>
        </DialogDescription>
      </DialogHeader>

      {loadError ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <TriangleAlert className="size-5" />
          </span>
          <p className="text-small text-muted-foreground">{loadError}</p>
          <Button
            variant="outline"
            onClick={() => {
              setLoadError(null)
              setReloadToken((n) => n + 1)
            }}
          >
            Try again
          </Button>
        </div>
      ) : detail === null ? (
        <div className="flex flex-col gap-3 py-4" aria-busy="true">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : (
        <ReturnDetailBody detail={detail} order={order} reload={reload} />
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}

/** Read-mostly return detail dialog over the real admin Returns + Orders APIs — status is editable in place. */
function ReturnDetailDialog({ returnRow, onClose, onChanged }: ReturnDetailDialogProps) {
  return (
    <Dialog
      open={returnRow !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        {returnRow ? <ReturnDetailLoader key={returnRow._id} returnRow={returnRow} onClose={onClose} onChanged={onChanged} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export { ReturnDetailDialog }
