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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { FormError } from "@/components/ui/form-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import {
  fetchAdminOrderDetail,
  formatOrderDateTime,
  orderStatusLabel,
  paymentStatusLabel,
  shipmentStatusLabel,
  updateAdminPaymentStatus,
  updateAdminShipment,
  type AdminOrderDetail,
  type AdminOrderRow,
  type AdminPaymentStatus,
  type AdminShipmentStatus,
} from "@/lib/api-client/admin-orders"
import { PAYMENT_METHOD_LABEL } from "@/lib/api-client/orders"
import { formatPrice } from "@/lib/format"

export type OrderDetailDialogProps = {
  order: AdminOrderRow | null
  onClose: () => void
  /** Called after a payment/shipment change so the table behind the dialog can refresh. */
  onChanged: () => void
}

const paymentOptions = (Object.keys(paymentStatusLabel) as AdminPaymentStatus[]).map((value) => ({
  value,
  label: paymentStatusLabel[value],
}))
const shipmentOptions = (Object.keys(shipmentStatusLabel) as AdminShipmentStatus[]).map((value) => ({
  value,
  label: shipmentStatusLabel[value],
}))

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage orders."
    if (err.status === 404) return err.message === "Resource not found" ? "This order no longer exists." : err.message
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

function variantLabel(variant: AdminOrderDetail["items"][number]["variant"]) {
  if (!variant) return null
  const parts = [variant.variantName, variant.color, variant.size].filter(Boolean)
  // variantName is often "Color / Size" already — don't repeat the same words.
  return (variant.variantName ? [variant.variantName] : parts).join(" · ") || variant.sku || null
}

/** Editable COD payment status — the admin API is the only way it changes. */
function PaymentSection({ detail, onSaved }: { detail: AdminOrderDetail; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = React.useState(false)
  const { payment } = detail

  if (!payment) {
    return (
      <Section title="Payment">
        <p className="text-small text-muted-foreground">No payment record exists for this order.</p>
      </Section>
    )
  }

  async function handleChange(status: AdminPaymentStatus) {
    if (!payment || status === payment.status) return
    setSaving(true)
    try {
      await updateAdminPaymentStatus(detail.order._id, status)
      toast.success("Payment updated", { description: `Payment is now ${paymentStatusLabel[status]}.` })
      await onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the payment. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Payment">
      <Row label="Method">{PAYMENT_METHOD_LABEL}</Row>
      <Row label="Amount">{formatPrice(payment.amount)}</Row>
      <Row label="Paid at">{payment.paidAt ? formatOrderDateTime(payment.paidAt) : "Not yet collected"}</Row>
      <div className="flex items-center justify-between gap-4 text-small">
        <Label htmlFor="payment-status" className="font-normal text-muted-foreground">
          Status
        </Label>
        <Select
          value={payment.status}
          items={paymentOptions}
          disabled={saving}
          onValueChange={(value) => void handleChange((value as AdminPaymentStatus) ?? payment.status)}
        >
          <SelectTrigger id="payment-status" className="w-40 rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {saving ? <p className="text-caption text-muted-foreground">Saving...</p> : null}
    </Section>
  )
}

/** Editable shipment (carrier, method, tracking, status, cost, estimated delivery) for the order's latest shipment. */
function ShipmentSection({ detail, onSaved }: { detail: AdminOrderDetail; onSaved: () => Promise<void> }) {
  const shipment = detail.shipments[0]
  const [carrier, setCarrier] = React.useState(shipment?.carrier ?? "")
  const [method, setMethod] = React.useState(shipment?.method ?? "")
  const [trackingNumber, setTrackingNumber] = React.useState(shipment?.trackingNumber ?? "")
  const [status, setStatus] = React.useState<AdminShipmentStatus>(shipment?.status ?? "pending")
  const [cost, setCost] = React.useState(shipment ? String(shipment.shipmentCost) : "0")
  const [estimatedDelivery, setEstimatedDelivery] = React.useState(shipment?.estimatedDelivery?.slice(0, 10) ?? "")
  const [error, setError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  if (!shipment) {
    return (
      <Section title="Shipment">
        <p className="text-small text-muted-foreground">No shipment exists for this order.</p>
      </Section>
    )
  }

  async function handleSave() {
    const shipmentCost = Number(cost)
    if (cost.trim() === "" || !Number.isFinite(shipmentCost) || shipmentCost < 0) {
      setError("Shipment cost must be 0 or more.")
      return
    }
    setError(null)
    setSaving(true)
    try {
      await updateAdminShipment(detail.order._id, {
        carrier: carrier.trim(),
        method: method.trim(),
        trackingNumber: trackingNumber.trim(),
        status,
        shipmentCost,
        estimatedDelivery: estimatedDelivery || undefined,
      })
      toast.success("Shipment updated", { description: `Shipment is now ${shipmentStatusLabel[status]}.` })
      await onSaved()
    } catch (err) {
      setError(errorMessage(err, "Couldn't update the shipment. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Shipment">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipment-carrier">Carrier</Label>
          <Input id="shipment-carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipment-method">Method</Label>
          <Input id="shipment-method" value={method} onChange={(e) => setMethod(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipment-tracking">Tracking number</Label>
          <Input id="shipment-tracking" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipment-status">Status</Label>
          <Select
            value={status}
            items={shipmentOptions}
            onValueChange={(value) => setStatus((value as AdminShipmentStatus) ?? status)}
          >
            <SelectTrigger id="shipment-status" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {shipmentOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipment-cost">Shipping cost (USD)</Label>
          <Input
            id="shipment-cost"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="shipment-eta">Estimated delivery</Label>
          <Input
            id="shipment-eta"
            type="date"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
          />
        </div>
      </div>
      <Row label="Shipped at">{shipment.shippedAt ? formatOrderDateTime(shipment.shippedAt) : "—"}</Row>
      <Row label="Delivered at">{shipment.deliveredAt ? formatOrderDateTime(shipment.deliveredAt) : "—"}</Row>
      <FormError message={error} />
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving..." : "Save Shipment"}
        </Button>
      </div>
    </Section>
  )
}

function OrderDetailBody({ detail, reload }: { detail: AdminOrderDetail; reload: () => Promise<void> }) {
  const { order, customer, items, statusHistory } = detail
  const address = order.shippingAddress
  const shipmentKey = JSON.stringify(detail.shipments[0] ?? null)

  return (
    <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto py-4 pr-1">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Section title="Customer">
          <p className="text-small text-foreground">
            {customer ? `${customer.firstName} ${customer.lastName}`.trim() : "Unknown customer"}
          </p>
          {customer ? <p className="text-small text-muted-foreground">{customer.email}</p> : null}
        </Section>
        <Section title="Shipping address">
          <address className="text-small leading-relaxed text-foreground not-italic">
            {address.fullName}
            <br />
            {address.street}
            {address.apartment ? `, ${address.apartment}` : ""}
            <br />
            {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
            <br />
            {address.country}
            <br />
            <span className="text-muted-foreground">{address.phone}</span>
          </address>
        </Section>
      </div>

      <Separator />

      <Section title={`Items (${items.length})`}>
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <li key={item._id} className="flex items-start justify-between gap-4 px-3 py-2.5 text-small">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.product?.name ?? "Unavailable product"}</p>
                {variantLabel(item.variant) ? (
                  <p className="text-caption text-muted-foreground">{variantLabel(item.variant)}</p>
                ) : null}
                <p className="text-caption text-muted-foreground">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <span className="shrink-0 font-medium text-foreground">{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1">
          <Row label="Subtotal">{formatPrice(order.subtotal)}</Row>
          {order.discount > 0 ? <Row label="Discount">−{formatPrice(order.discount)}</Row> : null}
          <Row label="Shipping">{formatPrice(order.shippingCost)}</Row>
          {order.tax > 0 ? <Row label="Tax">{formatPrice(order.tax)}</Row> : null}
          <Row label="Total">
            <span className="font-semibold">{formatPrice(order.total)}</span>
          </Row>
        </div>
      </Section>

      <Separator />

      <PaymentSection key={JSON.stringify(detail.payment)} detail={detail} onSaved={reload} />

      <Separator />

      <ShipmentSection key={shipmentKey} detail={detail} onSaved={reload} />

      <Separator />

      <Section title="Status history">
        {statusHistory.length === 0 ? (
          <p className="text-small text-muted-foreground">No status changes recorded.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {statusHistory.map((entry) => (
              <li key={entry._id} className="flex items-start justify-between gap-4 text-small">
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{orderStatusLabel[entry.status]}</span>
                  {entry.note ? <p className="text-caption text-muted-foreground">{entry.note}</p> : null}
                </div>
                <span className="shrink-0 text-caption text-muted-foreground">{formatOrderDateTime(entry.changedAt)}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  )
}

function OrderDetailLoader({
  order,
  onClose,
  onChanged,
}: {
  order: AdminOrderRow
  onClose: () => void
  onChanged: () => void
}) {
  const [detail, setDetail] = React.useState<AdminOrderDetail | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    fetchAdminOrderDetail(order._id)
      .then((result) => {
        if (cancelled) return
        setDetail(result)
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
      })
    return () => {
      cancelled = true
    }
  }, [order._id, reloadToken])

  // Re-read the order after a payment/shipment change, and let the table refresh too.
  const reload = React.useCallback(async () => {
    try {
      setDetail(await fetchAdminOrderDetail(order._id))
    } catch (err) {
      setLoadError(errorMessage(err, "Something went wrong. Please try again."))
    }
    onChanged()
  }, [order._id, onChanged])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Order {order.orderNumber}</DialogTitle>
        <DialogDescription className="flex items-center gap-2">
          Placed {formatOrderDateTime(order.createdAt)}
          <Badge variant="outline">{orderStatusLabel[detail?.order.status ?? order.status]}</Badge>
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
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <OrderDetailBody detail={detail} reload={reload} />
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}

/** Read-mostly order detail dialog over the real admin order API — payment and shipment are editable in place. */
function OrderDetailDialog({ order, onClose, onChanged }: OrderDetailDialogProps) {
  return (
    <Dialog
      open={order !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {order ? <OrderDetailLoader key={order._id} order={order} onClose={onClose} onChanged={onChanged} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export { OrderDetailDialog }
