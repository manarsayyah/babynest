import { apiFetch } from "@/lib/api-client/fetcher"
import { avatarForId } from "@/lib/avatars"
import type { AdminOrderStatus, AdminPaymentStatus } from "@/lib/api-client/admin-orders"

export type CustomerStatus = "active" | "inactive"

export const customerStatusLabel: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

export function formatCustomerDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** Local avatar (public/avatars) — a tone picked from the id so it's stable per customer. */
export function customerAvatar(customer: { _id: string; firstName: string; lastName: string }) {
  return avatarForId(customer._id)
}

/** Short display id derived from the real Mongo id (the last 6 hex chars). */
export function shortCustomerId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/** One row of GET /api/admin/customers — a real customer account plus order stats aggregated from Orders. */
export type AdminCustomerRow = {
  _id: string
  firstName: string
  lastName: string
  name: string
  email: string
  status: CustomerStatus
  createdAt: string
  /** Live, non-cancelled orders only (the Dashboard's revenue rule). */
  ordersCount: number
  totalSpent: number
  lastOrderDate: string | null
}

export type AdminCustomerSummary = {
  total: number
  active: number
  new: number
  returning: number
}

export type AdminCustomerListResponse = {
  items: AdminCustomerRow[]
  page: number
  limit: number
  total: number
  totalPages: number
  summary: AdminCustomerSummary
}

export type AdminCustomerDateRange = "30" | "90" | "year"
export type AdminCustomerSort = "newest" | "oldest" | "orders-desc" | "spent-desc" | "name-asc"

export type AdminCustomerQuery = {
  page?: number
  limit?: number
  search?: string
  status?: CustomerStatus
  dateRange?: AdminCustomerDateRange
  sort?: AdminCustomerSort
}

/** GET /api/admin/customers — real customer accounts from MongoDB (admin session required). */
export async function fetchAdminCustomers(
  params: AdminCustomerQuery = {},
  init?: RequestInit
): Promise<AdminCustomerListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminCustomerListResponse>(`/api/admin/customers${query ? `?${query}` : ""}`, {
    cache: "no-store",
    ...init,
  })
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export type AdminCustomerDetail = {
  customer: {
    _id: string
    firstName: string
    lastName: string
    name: string
    email: string
    role: string
    status: CustomerStatus
    createdAt: string
    updatedAt: string
    deletedAt: string | null
  }
  stats: { ordersCount: number; totalSpent: number; lastOrderDate: string | null; cancelledOrders: number }
  addresses: {
    _id: string
    label: string
    fullName: string
    phone: string
    street: string
    apartment: string | null
    city: string
    state: string | null
    postalCode: string | null
    country: string
    isDefault: boolean
  }[]
  orders: {
    _id: string
    orderNumber: string
    status: AdminOrderStatus
    total: number
    createdAt: string
    paymentStatus: AdminPaymentStatus | null
  }[]
  wishlistCount: number
  notifications: { total: number; unread: number }
}

/** GET /api/admin/customers/[id] — profile, addresses, order stats, recent orders, wishlist and notification counts. */
export function fetchAdminCustomerDetail(id: string): Promise<AdminCustomerDetail> {
  return apiFetch<AdminCustomerDetail>(`/api/admin/customers/${id}`, { cache: "no-store" })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export type CustomerUpdate = {
  firstName?: string
  lastName?: string
  email?: string
  status?: CustomerStatus
}

/** PATCH /api/admin/customers/[id] — edit name/email and/or disable (soft-delete) / enable the account. */
export function updateAdminCustomer(id: string, update: CustomerUpdate) {
  return apiFetch(`/api/admin/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  })
}
