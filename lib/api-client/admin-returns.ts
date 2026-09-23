import { apiFetch } from "@/lib/api-client/fetcher"
import { RETURN_STATUSES, RETURN_STATUS_TRANSITIONS } from "@/lib/validation/return"

export type ReturnStatus = (typeof RETURN_STATUSES)[number]

export const returnStatusLabel: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
}

/** The statuses a return can move to from its current one — re-exports the server's own state machine (lib/validation/return.ts) so the UI never offers a transition the API would reject. */
export function nextReturnStatuses(status: ReturnStatus): ReturnStatus[] {
  return [...RETURN_STATUS_TRANSITIONS[status]] as ReturnStatus[]
}

export function formatReturnDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatReturnDateTime(isoDate: string) {
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

/** One row of GET /api/admin/returns — the real Return document (no order/customer enrichment; the list
 * endpoint doesn't join those, so the page fetches each row's order separately — see fetchAdminOrderDetail). */
export type AdminReturnRow = {
  _id: string
  orderId: string
  reason: string
  status: ReturnStatus
  requestedAt: string
  createdAt: string
  updatedAt: string
}

export type AdminReturnListResponse = {
  items: AdminReturnRow[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminReturnQuery = {
  page?: number
  limit?: number
  status?: ReturnStatus
  orderId?: string
}

/** GET /api/admin/returns — real return requests from MongoDB (admin session required). */
export async function fetchAdminReturns(
  params: AdminReturnQuery = {},
  init?: RequestInit
): Promise<AdminReturnListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminReturnListResponse>(`/api/admin/returns${query ? `?${query}` : ""}`, {
    cache: "no-store",
    ...init,
  })
}

export type AdminReturnSummary = Record<"total" | ReturnStatus, number>

/** Real counts per status, built from the existing list endpoint's `total` (the API has no dedicated summary
 * shape for Returns, same situation as Promotions — see fetchAdminPromotionsSummary). */
export async function fetchAdminReturnsSummary(init?: RequestInit): Promise<AdminReturnSummary> {
  const [total, requested, approved, rejected, completed] = await Promise.all([
    fetchAdminReturns({ limit: 1 }, init),
    fetchAdminReturns({ limit: 1, status: "requested" }, init),
    fetchAdminReturns({ limit: 1, status: "approved" }, init),
    fetchAdminReturns({ limit: 1, status: "rejected" }, init),
    fetchAdminReturns({ limit: 1, status: "completed" }, init),
  ])
  return {
    total: total.total,
    requested: requested.total,
    approved: approved.total,
    rejected: rejected.total,
    completed: completed.total,
  }
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export type AdminReturnItem = { _id: string; orderItemId: string; quantity: number; condition?: string }

export type AdminReturnDetail = {
  return: AdminReturnRow
  items: AdminReturnItem[]
  /** A partial Order — only what GET /api/admin/returns/[id] selects (orderNumber, userId, status). */
  order: { _id: string; orderNumber: string; userId: string; status: string } | null
}

/** GET /api/admin/returns/[id] */
export function fetchAdminReturnDetail(id: string): Promise<AdminReturnDetail> {
  return apiFetch<AdminReturnDetail>(`/api/admin/returns/${id}`, { cache: "no-store" })
}

// ---------------------------------------------------------------------------
// Mutations (existing return endpoint — status is the only admin-editable field this UI uses)
// ---------------------------------------------------------------------------

/** PATCH /api/admin/returns/[id] — the server enforces RETURN_STATUS_TRANSITIONS; an invalid move is rejected with 409. */
export function updateAdminReturnStatus(id: string, status: ReturnStatus) {
  return apiFetch<{ return: AdminReturnRow; items: AdminReturnItem[] }>(`/api/admin/returns/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
}
