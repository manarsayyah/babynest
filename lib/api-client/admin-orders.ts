import { apiFetch } from "@/lib/api-client/fetcher"
import type { ApiOrder, ApiPayment, ApiShipment, OrderStatus } from "@/lib/api-client/orders"

// ---------------------------------------------------------------------------
// Statuses & labels
// ---------------------------------------------------------------------------

export type AdminOrderStatus = OrderStatus
export type AdminPaymentStatus = ApiPayment["status"]
export type AdminShipmentStatus = ApiShipment["status"]

export const orderStatusLabel: Record<AdminOrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const paymentStatusLabel: Record<AdminPaymentStatus, string> = {
  paid: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
}

export const shipmentStatusLabel: Record<AdminShipmentStatus, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  returned: "Returned",
}

/** Statuses an order can be moved to from the "Update Status" menu, in workflow order (the API's own enum). */
export const orderStatusSequence: AdminOrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"]

/** Only still-in-progress orders can be cancelled from the table. */
export function isOrderCancellable(order: { status: AdminOrderStatus }) {
  return order.status === "pending" || order.status === "processing"
}

export function formatOrderDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatOrderDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/** One row of GET /api/admin/orders — a real Order plus its customer, payment, latest shipment and item count. */
export type AdminOrderRow = ApiOrder & {
  customer: { id: string; name: string; email: string } | null
  itemCount: number
  /** Total units across all lines — what the table's "Items" column shows (same as the customer's order list). */
  totalQuantity: number
  payment: { method: ApiPayment["method"]; status: AdminPaymentStatus; amount: number; paidAt: string | null } | null
  shipment: { status: AdminShipmentStatus; carrier: string | null; trackingNumber: string | null } | null
}

export type AdminOrderSummary = {
  total: number
  pending: number
  processing: number
  delivered: number
  cancelled: number
}

export type AdminOrderListResponse = {
  items: AdminOrderRow[]
  page: number
  limit: number
  total: number
  totalPages: number
  summary: AdminOrderSummary
}

export type AdminOrderDateRange = "30" | "90" | "year"
export type AdminOrderSort = "newest" | "oldest" | "amount-desc" | "amount-asc"

export type AdminOrderQuery = {
  page?: number
  limit?: number
  search?: string
  status?: AdminOrderStatus
  paymentStatus?: AdminPaymentStatus
  dateRange?: AdminOrderDateRange
  sort?: AdminOrderSort
}

/** GET /api/admin/orders — real orders from MongoDB (admin session required). */
export async function fetchAdminOrders(
  params: AdminOrderQuery = {},
  init?: RequestInit
): Promise<AdminOrderListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminOrderListResponse>(`/api/admin/orders${query ? `?${query}` : ""}`, {
    cache: "no-store",
    ...init,
  })
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export type AdminOrderDetail = {
  order: ApiOrder & { userId: string; updatedAt?: string }
  customer: { _id: string; firstName: string; lastName: string; email: string } | null
  items: {
    _id: string
    productId: string
    variantId?: string | null
    quantity: number
    unitPrice: number
    subtotal: number
    variant: { sku?: string; variantName?: string; color?: string; size?: string } | null
    product: { name: string; slug: string } | null
  }[]
  payment: (ApiPayment & { _id: string }) | null
  shipments: (ApiShipment & { _id: string })[]
  statusHistory: { _id: string; status: AdminOrderStatus; note?: string; changedAt: string }[]
}

/** GET /api/admin/orders/[id] — the order with customer, items (product/variant), payment, shipments and status history. */
export function fetchAdminOrderDetail(id: string): Promise<AdminOrderDetail> {
  return apiFetch<AdminOrderDetail>(`/api/admin/orders/${id}`, { cache: "no-store" })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function jsonPatch(body: unknown): RequestInit {
  return { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
}

/** PATCH /api/admin/orders/[id] — updates the status and records an OrderStatusHistory row (server-side). */
export function updateAdminOrderStatus(id: string, status: AdminOrderStatus, note?: string) {
  return apiFetch(`/api/admin/orders/${id}`, jsonPatch({ status, note }))
}

/** PATCH /api/admin/orders/[id]/payment — the only way a COD payment's status changes. */
export function updateAdminPaymentStatus(id: string, status: AdminPaymentStatus) {
  return apiFetch(`/api/admin/orders/${id}/payment`, jsonPatch({ status }))
}

export type ShipmentUpdate = {
  carrier?: string
  method?: string
  trackingNumber?: string
  status?: AdminShipmentStatus
  shipmentCost?: number
  estimatedDelivery?: string
}

/** PATCH /api/admin/orders/[id]/shipment — updates the order's latest active shipment. */
export function updateAdminShipment(id: string, update: ShipmentUpdate) {
  return apiFetch(`/api/admin/orders/${id}/shipment`, jsonPatch(update))
}
