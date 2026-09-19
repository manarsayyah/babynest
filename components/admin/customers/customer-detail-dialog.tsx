"use client"

import * as React from "react"
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
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import {
  customerAvatar,
  customerStatusLabel,
  fetchAdminCustomerDetail,
  formatCustomerDate,
  shortCustomerId,
  type AdminCustomerDetail,
  type AdminCustomerRow,
} from "@/lib/api-client/admin-customers"
import { formatOrderDate, orderStatusLabel, paymentStatusLabel } from "@/lib/api-client/admin-orders"
import { formatPrice } from "@/lib/format"

export type CustomerDetailState = { customer: AdminCustomerRow; focus: "profile" | "orders" }

export type CustomerDetailDialogProps = {
  state: CustomerDetailState | null
  onClose: () => void
}

function errorMessage(err: unknown) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to view customers."
    if (err.status === 404) return "This customer no longer exists."
    if (err.status < 500) return err.message
  }
  return "Something went wrong. Please try again."
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="flex flex-col gap-2">
      <h3 className="text-h4 text-foreground">{title}</h3>
      {children}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2.5">
      <span className="block text-caption text-muted-foreground">{label}</span>
      <span className="text-small font-medium text-foreground">{value}</span>
    </div>
  )
}

const orderBadgeVariant = {
  pending: "warning",
  processing: "ai",
  shipped: "default",
  delivered: "success",
  cancelled: "destructive",
} as const

function CustomerDetailBody({ detail, focus }: { detail: AdminCustomerDetail; focus: "profile" | "orders" }) {
  const { customer, stats, addresses, orders, wishlistCount, notifications } = detail
  const ordersRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (focus === "orders") ordersRef.current?.scrollIntoView({ block: "start" })
  }, [focus])

  return (
    <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto py-4 pr-1">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Orders" value={stats.ordersCount} />
        <Stat label="Total Spent" value={formatPrice(stats.totalSpent)} />
        <Stat label="Last Order" value={stats.lastOrderDate ? formatCustomerDate(stats.lastOrderDate) : "—"} />
        <Stat label="Cancelled" value={stats.cancelledOrders} />
      </div>
      <p className="text-caption text-muted-foreground">
        Orders and Total Spent count placed orders only — cancelled orders are excluded.
      </p>

      <Separator />

      <Section title="Profile">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-small sm:grid-cols-2">
          <div>
            <dt className="text-caption text-muted-foreground">Email</dt>
            <dd className="text-foreground">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Role</dt>
            <dd className="text-foreground capitalize">{customer.role}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Joined</dt>
            <dd className="text-foreground">{formatCustomerDate(customer.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Last updated</dt>
            <dd className="text-foreground">{formatCustomerDate(customer.updatedAt)}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Wishlist</dt>
            <dd className="text-foreground">
              {wishlistCount} {wishlistCount === 1 ? "saved item" : "saved items"}
            </dd>
          </div>
          <div>
            <dt className="text-caption text-muted-foreground">Notifications</dt>
            <dd className="text-foreground">
              {notifications.total} total, {notifications.unread} unread
            </dd>
          </div>
        </dl>
      </Section>

      <Separator />

      <Section title={`Addresses (${addresses.length})`}>
        {addresses.length === 0 ? (
          <p className="text-small text-muted-foreground">No saved addresses.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {addresses.map((address) => (
              <li key={address._id} className="rounded-lg border border-border px-3 py-2.5 text-small">
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="font-medium text-foreground">{address.label}</span>
                  {address.isDefault ? <Badge variant="outline">Default</Badge> : null}
                </div>
                <address className="leading-relaxed text-muted-foreground not-italic">
                  {address.fullName} · {address.phone}
                  <br />
                  {address.street}
                  {address.apartment ? `, ${address.apartment}` : ""}
                  <br />
                  {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}, {address.country}
                </address>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Separator />

      <section ref={ordersRef} className="flex flex-col gap-2">
        <h3 className="text-h4 text-foreground">Orders ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-small text-muted-foreground">This customer hasn&apos;t placed any orders yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {orders.map((order) => (
              <li key={order._id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-small">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{order.orderNumber}</p>
                  <p className="text-caption text-muted-foreground">
                    {formatOrderDate(order.createdAt)}
                    {order.paymentStatus ? ` · Payment ${paymentStatusLabel[order.paymentStatus]}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={orderBadgeVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                  <span className="font-medium text-foreground">{formatPrice(order.total)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function CustomerDetailLoader({ state, onClose }: { state: CustomerDetailState; onClose: () => void }) {
  const { customer, focus } = state
  const [detail, setDetail] = React.useState<AdminCustomerDetail | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false
    fetchAdminCustomerDetail(customer._id)
      .then((result) => {
        if (cancelled) return
        setDetail(result)
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [customer._id, reloadToken])

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customerAvatar(customer)}
            alt={customer.name}
            className="size-11 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
          />
          <div className="min-w-0">
            <DialogTitle>{customer.name}</DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              {shortCustomerId(customer._id)}
              <Badge variant={(detail?.customer.status ?? customer.status) === "active" ? "success" : "outline"}>
                {customerStatusLabel[detail?.customer.status ?? customer.status]}
              </Badge>
            </DialogDescription>
          </div>
        </div>
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
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ) : (
        <CustomerDetailBody detail={detail} focus={focus} />
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  )
}

/** Read-only customer detail dialog over the real admin customer API (profile, stats, addresses, orders, wishlist, notifications). */
function CustomerDetailDialog({ state, onClose }: CustomerDetailDialogProps) {
  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        {state ? <CustomerDetailLoader key={`${state.customer._id}-${state.focus}`} state={state} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export { CustomerDetailDialog }
