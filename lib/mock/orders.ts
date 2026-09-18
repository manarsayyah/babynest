import { mockCategories } from "@/lib/mock/categories"
import { shopCatalog, type ShopProduct } from "@/lib/mock/shop-catalog"
import { defaultAddress } from "@/lib/mock/account"

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled"

export const orderStatusLabel: Record<OrderStatus, string> = {
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export type OrderItem = {
  product: ShopProduct
  quantity: number
  /** e.g. "Size: 6-12 Months" or "Color: Soft Peach" — only set where a variant makes sense. */
  variant?: string
}

export type Order = {
  id: string
  date: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus: "Paid" | "Refunded"
  shippingName: string
  shippingLine1: string
  shippingCity: string
  shippingPhone: string
  shippingMethod: string
  trackingNumber?: string
  deliveredDate?: string
}

function bySlug(slug: string) {
  const product = shopCatalog.find((p) => p.slug === slug)
  if (!product) throw new Error(`Unknown mock order product slug: ${slug}`)
  return product
}

const VARIANT_BY_SLUG: Record<string, string> = {
  "organic-cotton-onesie": "Size: 6-12 Months",
  "knit-baby-cardigan": "Size: 6-12 Months",
  "soft-cotton-sleep-gown": "Size: 0-6 Months",
  "glass-baby-bottle-set": "Color: Soft Peach",
  "bamboo-toddler-feeding-set": "Color: Sage Green",
  "silicone-bib-set": "Color: Blush",
  "wooden-stacking-toy": "Color: Natural Wood",
  "overnight-diapers-size-3": "Size: 3 (16-28 lbs)",
}

function buildOrder(input: {
  id: string
  date: string
  status: OrderStatus
  items: { slug: string; quantity: number }[]
  discount?: number
  paymentMethod: string
  shippingMethod?: string
  trackingNumber?: string
  deliveredDate?: string
}): Order {
  const items: OrderItem[] = input.items.map(({ slug, quantity }) => ({
    product: bySlug(slug),
    quantity,
    variant: VARIANT_BY_SLUG[slug],
  }))
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const discount = input.discount ?? 0
  const shipping = subtotal >= 75 ? 0 : 6.99
  const tax = Math.round(subtotal * 0.05 * 100) / 100
  const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100

  return {
    id: input.id,
    date: input.date,
    status: input.status,
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.status === "cancelled" ? "Refunded" : "Paid",
    shippingName: defaultAddress.name,
    shippingLine1: defaultAddress.line1,
    shippingCity: defaultAddress.city,
    shippingPhone: defaultAddress.phone,
    shippingMethod: input.shippingMethod ?? "Standard Delivery",
    trackingNumber: input.trackingNumber,
    deliveredDate: input.deliveredDate,
  }
}

/** 8 mock orders — #BN-10245/10198/10142 match the 3 shown on the Account overview's "Recent Orders" widget. */
export const orders: Order[] = [
  buildOrder({
    id: "#BN-10245",
    date: "September 12, 2026",
    status: "delivered",
    items: [
      { slug: "organic-cotton-onesie", quantity: 2 },
      { slug: "glass-baby-bottle-set", quantity: 1 },
      { slug: "soft-plush-bear", quantity: 1 },
      { slug: "silicone-bath-toys", quantity: 1 },
    ],
    discount: 10,
    paymentMethod: "Visa •••• 4821",
    trackingNumber: "BNTRK982451",
    deliveredDate: "September 15, 2026",
  }),
  buildOrder({
    id: "#BN-10198",
    date: "September 5, 2026",
    status: "processing",
    items: [
      { slug: "bamboo-toddler-feeding-set", quantity: 1 },
      { slug: "silicone-bib-set", quantity: 1 },
    ],
    paymentMethod: "Mastercard •••• 2290",
  }),
  buildOrder({
    id: "#BN-10142",
    date: "August 28, 2026",
    status: "shipped",
    items: [
      { slug: "baby-monitor", quantity: 1 },
      { slug: "starlight-nursery-mobile", quantity: 1 },
      { slug: "hooded-bath-towel-set", quantity: 1 },
    ],
    paymentMethod: "Visa •••• 4821",
    shippingMethod: "Express Delivery",
    trackingNumber: "BNTRK977213",
  }),
  buildOrder({
    id: "#BN-10089",
    date: "August 20, 2026",
    status: "processing",
    items: [
      { slug: "wooden-stacking-toy", quantity: 1 },
      { slug: "baby-play-gym", quantity: 1 },
    ],
    paymentMethod: "PayPal",
  }),
  buildOrder({
    id: "#BN-10034",
    date: "August 10, 2026",
    status: "delivered",
    items: [{ slug: "premium-baby-stroller", quantity: 1 }],
    paymentMethod: "Visa •••• 4821",
    trackingNumber: "BNTRK951087",
    deliveredDate: "August 14, 2026",
  }),
  buildOrder({
    id: "#BN-09977",
    date: "July 30, 2026",
    status: "delivered",
    items: [
      { slug: "convertible-car-seat", quantity: 1 },
      { slug: "infant-car-seat-with-base", quantity: 1 },
    ],
    paymentMethod: "Mastercard •••• 2290",
    trackingNumber: "BNTRK933012",
    deliveredDate: "August 3, 2026",
  }),
  buildOrder({
    id: "#BN-09912",
    date: "July 18, 2026",
    status: "delivered",
    items: [
      { slug: "knit-baby-cardigan", quantity: 1 },
      { slug: "soft-cotton-sleep-gown", quantity: 1 },
      { slug: "overnight-diapers-size-3", quantity: 1 },
    ],
    paymentMethod: "Visa •••• 4821",
    trackingNumber: "BNTRK918845",
    deliveredDate: "July 22, 2026",
  }),
  buildOrder({
    id: "#BN-09850",
    date: "July 5, 2026",
    status: "cancelled",
    items: [{ slug: "jogging-stroller", quantity: 1 }],
    paymentMethod: "Visa •••• 4821",
  }),
]

/** Strips the leading "#" for use in a URL segment, e.g. "#BN-10245" -> "BN-10245". */
export function orderRouteId(order: Order) {
  return order.id.replace(/^#/, "")
}

/** Looks up an order by its route id — accepts with or without the leading "#", case-insensitively. */
export function getOrderById(id: string) {
  const normalized = decodeURIComponent(id).replace(/^#/, "").toUpperCase()
  return orders.find((order) => order.id.replace(/^#/, "").toUpperCase() === normalized)
}

export function categoryLabelFor(slug: string) {
  return mockCategories.find((category) => category.slug === slug)?.name ?? slug
}

/** Only orders still in progress can be cancelled — matches the action available on the /account/orders list. */
export function isOrderCancellable(order: Order) {
  return order.status === "processing"
}

function offsetDate(dateStr: string, days: number) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export type OrderActivityEntry = { date: string; title: string }

/** Derives a newest-first activity timeline from the order's confirmed/shipped/delivered dates. */
export function getOrderActivity(order: Order): OrderActivityEntry[] {
  const confirmed: OrderActivityEntry = { date: order.date, title: "Order confirmed and payment verified" }
  const shipped: OrderActivityEntry = {
    date: offsetDate(order.date, 1),
    title: `Package shipped via ${order.shippingMethod}`,
  }

  if (order.status === "cancelled") {
    return [{ date: order.date, title: "Order cancelled and refund issued" }, confirmed]
  }
  if (order.status === "processing") {
    return [confirmed]
  }
  if (order.status === "shipped") {
    return [
      { date: offsetDate(order.date, 2), title: "Out for delivery with courier" },
      shipped,
      confirmed,
    ]
  }

  const delivered = order.deliveredDate ?? offsetDate(order.date, 3)
  return [
    { date: delivered, title: `Order delivered to ${order.shippingCity}` },
    { date: offsetDate(delivered, -1), title: "Out for delivery with courier" },
    shipped,
    confirmed,
  ]
}
