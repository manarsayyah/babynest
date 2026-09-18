/**
 * Store-wide order list for the Admin Orders page. Distinct from
 * `lib/mock/orders.ts` (one shopper's own order history) and from
 * `dashboardStats.recentOrdersPreview` (the Dashboard's 6-row "Recent
 * Orders" widget) — this is the fuller admin dataset, kept in its own file
 * so it's a one-file swap once a real `/api/admin/orders` endpoint exists.
 */
export type AdminOrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"
export type AdminPaymentStatus = "paid" | "pending" | "failed" | "refunded"

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

/** Statuses an order can be moved to from the "Update Status" menu, in workflow order. */
export const orderStatusSequence: AdminOrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"]

export type AdminOrder = {
  id: string
  customerName: string
  customerEmail: string
  /** ISO date, e.g. "2026-09-14" — kept separate from display formatting so filtering/sorting stay simple. */
  date: string
  itemCount: number
  total: number
  paymentStatus: AdminPaymentStatus
  status: AdminOrderStatus
}

export const adminOrders: AdminOrder[] = [
  { id: "#BN-1024", customerName: "Sarah Miller", customerEmail: "sarah.miller@gmail.com", date: "2026-09-14", itemCount: 3, total: 84.5, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1025", customerName: "Emma Wilson", customerEmail: "emma.wilson@gmail.com", date: "2026-09-14", itemCount: 2, total: 52.0, paymentStatus: "paid", status: "processing" },
  { id: "#BN-1026", customerName: "Lina Carter", customerEmail: "lina.carter@gmail.com", date: "2026-09-13", itemCount: 1, total: 24.99, paymentStatus: "pending", status: "pending" },
  { id: "#BN-1027", customerName: "Omar Khalil", customerEmail: "omar.khalil@gmail.com", date: "2026-09-13", itemCount: 4, total: 199.99, paymentStatus: "paid", status: "shipped" },
  { id: "#BN-1028", customerName: "Nour Fares", customerEmail: "nour.fares@gmail.com", date: "2026-09-12", itemCount: 1, total: 89.99, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1029", customerName: "Manar Sayyah", customerEmail: "manar.sayyah@gmail.com", date: "2026-09-12", itemCount: 2, total: 46.99, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1030", customerName: "Rami Saad", customerEmail: "rami.saad@gmail.com", date: "2026-09-11", itemCount: 1, total: 189.99, paymentStatus: "refunded", status: "cancelled" },
  { id: "#BN-1031", customerName: "Layla Haddad", customerEmail: "layla.haddad@gmail.com", date: "2026-09-11", itemCount: 3, total: 74.97, paymentStatus: "paid", status: "processing" },
  { id: "#BN-1032", customerName: "Yousef Nassar", customerEmail: "yousef.nassar@gmail.com", date: "2026-09-10", itemCount: 2, total: 58.0, paymentStatus: "failed", status: "pending" },
  { id: "#BN-1033", customerName: "Dana Aziz", customerEmail: "dana.aziz@gmail.com", date: "2026-09-10", itemCount: 1, total: 42.0, paymentStatus: "paid", status: "shipped" },
  { id: "#BN-1034", customerName: "Hana Odeh", customerEmail: "hana.odeh@gmail.com", date: "2026-09-09", itemCount: 5, total: 214.5, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1035", customerName: "Karim Mansour", customerEmail: "karim.mansour@gmail.com", date: "2026-09-08", itemCount: 1, total: 18.5, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1036", customerName: "Farah Zidan", customerEmail: "farah.zidan@gmail.com", date: "2026-09-08", itemCount: 2, total: 39.98, paymentStatus: "pending", status: "pending" },
  { id: "#BN-1037", customerName: "Adam Haddad", customerEmail: "adam.haddad@gmail.com", date: "2026-09-07", itemCount: 3, total: 112.97, paymentStatus: "paid", status: "processing" },
  { id: "#BN-1038", customerName: "Maya Kassab", customerEmail: "maya.kassab@gmail.com", date: "2026-09-06", itemCount: 1, total: 26.0, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1039", customerName: "Tariq Amin", customerEmail: "tariq.amin@gmail.com", date: "2026-09-05", itemCount: 2, total: 64.98, paymentStatus: "refunded", status: "cancelled" },
  { id: "#BN-1040", customerName: "Salma Rahal", customerEmail: "salma.rahal@gmail.com", date: "2026-09-05", itemCount: 4, total: 158.0, paymentStatus: "paid", status: "shipped" },
  { id: "#BN-1041", customerName: "Nadia Farouk", customerEmail: "nadia.farouk@gmail.com", date: "2026-09-04", itemCount: 1, total: 21.99, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1042", customerName: "Zaid Homsi", customerEmail: "zaid.homsi@gmail.com", date: "2026-09-03", itemCount: 2, total: 47.98, paymentStatus: "paid", status: "processing" },
  { id: "#BN-1043", customerName: "Rania Saleh", customerEmail: "rania.saleh@gmail.com", date: "2026-09-02", itemCount: 1, total: 34.99, paymentStatus: "pending", status: "pending" },
  { id: "#BN-1044", customerName: "Bilal Nasser", customerEmail: "bilal.nasser@gmail.com", date: "2026-09-01", itemCount: 3, total: 96.97, paymentStatus: "paid", status: "delivered" },
  { id: "#BN-1045", customerName: "Yasmin Toubasi", customerEmail: "yasmin.toubasi@gmail.com", date: "2026-08-31", itemCount: 1, total: 22.0, paymentStatus: "paid", status: "delivered" },
]

/** Mirrors the storefront's rule: only still-in-progress orders can be cancelled from the table. */
export function isOrderCancellable(order: AdminOrder) {
  return order.status === "pending" || order.status === "processing"
}

export function formatOrderDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
