import { apiFetch } from "@/lib/api-client/fetcher"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"

// ---------------------------------------------------------------------------
// Raw API shapes (what app/api/orders/** actually returns, JSON-serialised)
// ---------------------------------------------------------------------------

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export type ApiShippingAddress = {
  fullName: string
  phone: string
  street: string
  apartment?: string
  city: string
  state?: string
  country: string
  postalCode?: string
}

export type ApiOrder = {
  _id: string
  orderNumber: string
  status: OrderStatus
  subtotal: number
  discount: number
  shippingCost: number
  tax: number
  total: number
  shippingAddress: ApiShippingAddress
  createdAt: string
}

export type ApiPayment = {
  method: "CASH_ON_DELIVERY"
  status: "pending" | "paid" | "refunded" | "failed"
  amount: number
  paidAt: string | null
}

export type ApiShipment = {
  _id: string
  carrier?: string
  method?: string
  trackingNumber?: string
  status: "pending" | "shipped" | "delivered" | "returned"
  shipmentCost: number
  estimatedDelivery?: string
  shippedAt: string | null
  deliveredAt: string | null
}

export type ApiOrderListEntry = ApiOrder & {
  itemCount: number
  totalQuantity: number
  lineItems: {
    productId: string
    variantId?: string | null
    quantity: number
    name: string
    slug: string | null
    image: string | null
  }[]
}

export type ApiOrderDetail = {
  order: ApiOrder
  items: {
    _id: string
    productId: string
    variantId?: string | null
    quantity: number
    unitPrice: number
    subtotal: number
    variant: { color?: string; size?: string; variantName?: string } | null
    product: {
      name: string
      slug: string
      rating: number
      primaryImage?: { imageUrl: string } | null
    } | null
  }[]
  payment: ApiPayment | null
  shipments: ApiShipment[]
  statusHistory: { status: OrderStatus; note?: string; changedAt: string }[]
}

export type ApiCreatedOrder = {
  order: ApiOrder
  payment: ApiPayment
  shipment: ApiShipment
}

// ---------------------------------------------------------------------------
// View-model consumed by the existing order components
// ---------------------------------------------------------------------------

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export type PaymentStatusLabel = "Pending" | "Paid" | "Refunded" | "Failed"

const paymentStatusLabel: Record<ApiPayment["status"], PaymentStatusLabel> = {
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
}

export const PAYMENT_METHOD_LABEL = "Cash on Delivery"

export type OrderItem = {
  /** The OrderItem document id — what a return request refers to. Only present on the detail view. */
  orderItemId?: string
  product: { id: string; slug: string; name: string; image: string; rating?: number; price: number }
  quantity: number
  variantId?: string
  /** e.g. "Color: Sage · Size: M" — only when the variant has attributes. */
  variant?: string
}

export type OrderActivityEntry = { date: string; title: string }

export type Order = {
  /** Human-readable order number — what the UI shows as the order's id. */
  id: string
  /** Mongo id — what the API and /orders/[id] URLs use. */
  routeId: string
  date: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: PaymentStatusLabel
  shippingName: string
  shippingLine1: string
  shippingCity: string
  shippingPhone: string
  shippingMethod: string
  carrier?: string
  trackingNumber?: string
  estimatedDelivery?: string
  shippedDate?: string
  deliveredDate?: string
  activity: OrderActivityEntry[]
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function shippingFields(address: ApiShippingAddress) {
  return {
    shippingName: address.fullName,
    shippingLine1: [address.street, address.apartment].filter(Boolean).join(", "),
    shippingCity: [address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", "),
    shippingPhone: address.phone,
  }
}

function variantLabel(variant: { color?: string; size?: string } | null): string | undefined {
  if (!variant) return undefined
  const parts = [variant.color ? `Color: ${variant.color}` : null, variant.size ? `Size: ${variant.size}` : null].filter(
    (part): part is string => part !== null
  )
  return parts.length > 0 ? parts.join(" · ") : undefined
}

export function toOrderFromListEntry(entry: ApiOrderListEntry): Order {
  return {
    id: entry.orderNumber,
    routeId: entry._id,
    date: formatOrderDate(entry.createdAt),
    status: entry.status,
    items: entry.lineItems.map((line) => ({
      product: {
        id: line.productId,
        slug: line.slug ?? "",
        name: line.name,
        image: line.image ?? PLACEHOLDER_PRODUCT_IMAGE,
        price: 0,
      },
      quantity: line.quantity,
      variantId: line.variantId ?? undefined,
    })),
    subtotal: entry.subtotal,
    discount: entry.discount,
    shipping: entry.shippingCost,
    tax: entry.tax,
    total: entry.total,
    paymentMethod: PAYMENT_METHOD_LABEL,
    // The list endpoint carries no payment/shipment rows; the detail page shows those.
    paymentStatus: "Pending",
    ...shippingFields(entry.shippingAddress),
    shippingMethod: "Standard Delivery",
    activity: [],
  }
}

export function toOrderFromDetail(detail: ApiOrderDetail): Order {
  const { order, items, payment, shipments, statusHistory } = detail
  const shipment = shipments[0]

  const activity: OrderActivityEntry[] = [...statusHistory]
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .map((entry) => ({
      date: formatOrderDate(entry.changedAt),
      title: entry.note?.trim() || `Order ${orderStatusLabel[entry.status].toLowerCase()}`,
    }))

  return {
    id: order.orderNumber,
    routeId: order._id,
    date: formatOrderDate(order.createdAt),
    status: order.status,
    items: items.map((item) => ({
      product: {
        id: item.productId,
        slug: item.product?.slug ?? "",
        name: item.product?.name ?? "Unavailable product",
        image: item.product?.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE,
        rating: item.product?.rating,
        // Unit price actually charged for this order line — not the product's current price.
        price: item.unitPrice,
      },
      quantity: item.quantity,
      orderItemId: item._id,
      variantId: item.variantId ?? undefined,
      variant: variantLabel(item.variant),
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shippingCost,
    tax: order.tax,
    total: order.total,
    paymentMethod: PAYMENT_METHOD_LABEL,
    paymentStatus: payment ? paymentStatusLabel[payment.status] : "Pending",
    ...shippingFields(order.shippingAddress),
    shippingMethod: shipment?.method ?? "Standard Delivery",
    carrier: shipment?.carrier || undefined,
    trackingNumber: shipment?.trackingNumber || undefined,
    estimatedDelivery: shipment?.estimatedDelivery ? formatOrderDate(shipment.estimatedDelivery) : undefined,
    shippedDate: shipment?.shippedAt ? formatOrderDate(shipment.shippedAt) : undefined,
    deliveredDate: shipment?.deliveredAt ? formatOrderDate(shipment.deliveredAt) : undefined,
    activity,
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** GET /api/orders — every one of the caller's own orders, newest first (pages are followed until exhausted). */
export async function fetchOrders(): Promise<Order[]> {
  const orders: Order[] = []
  let page = 1
  for (;;) {
    const result = await apiFetch<{ items: ApiOrderListEntry[]; totalPages: number }>(
      `/api/orders?page=${page}&limit=100`,
      { cache: "no-store" }
    )
    orders.push(...result.items.map(toOrderFromListEntry))
    if (page >= result.totalPages) break
    page += 1
  }
  return orders
}

/** GET /api/orders/[id] — 404s for a missing order and for someone else's order alike. */
export async function fetchOrder(id: string): Promise<Order> {
  const detail = await apiFetch<ApiOrderDetail>(`/api/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
  return toOrderFromDetail(detail)
}

/**
 * POST /api/orders — checkout. Sends only the chosen address id (and the promotion *code*, never an amount); prices, stock, totals, shipping
 * and the Cash on Delivery payment are all decided by the server from the caller's real cart.
 */
export async function createOrder(addressId: string, promotionCode?: string): Promise<ApiCreatedOrder> {
  return apiFetch<ApiCreatedOrder>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(promotionCode ? { addressId, promotionCode } : { addressId }),
  })
}
