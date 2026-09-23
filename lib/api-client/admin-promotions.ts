import { apiFetch } from "@/lib/api-client/fetcher"

export type DiscountType = "percentage" | "fixed"

/** One row of GET /api/admin/promotions — the real Promotion document. */
export type AdminPromotionRow = {
  _id: string
  code: string
  description?: string
  discountType: DiscountType
  discountValue: number
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AdminPromotionListResponse = {
  items: AdminPromotionRow[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type AdminPromotionQuery = {
  page?: number
  limit?: number
  code?: string
  isActive?: boolean
}

export function formatPromotionDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** "15% off" / "$5.00 off" — matches the wording used at checkout (see lib/api-client/promotions.ts). */
export function describeDiscount(promotion: Pick<AdminPromotionRow, "discountType" | "discountValue">) {
  return promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `$${promotion.discountValue.toFixed(2)} off`
}

/** requested/live/upcoming/expired from real dates + isActive — no separate field exists for this on the model. */
export type PromotionLifecycle = "inactive" | "upcoming" | "live" | "expired"

export function promotionLifecycle(promotion: Pick<AdminPromotionRow, "isActive" | "startDate" | "endDate">): PromotionLifecycle {
  if (!promotion.isActive) return "inactive"
  const now = Date.now()
  if (now < new Date(promotion.startDate).getTime()) return "upcoming"
  if (now > new Date(promotion.endDate).getTime()) return "expired"
  return "live"
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/** GET /api/admin/promotions — real promotions from MongoDB (admin session required). */
export async function fetchAdminPromotions(
  params: AdminPromotionQuery = {},
  init?: RequestInit
): Promise<AdminPromotionListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminPromotionListResponse>(`/api/admin/promotions${query ? `?${query}` : ""}`, {
    cache: "no-store",
    ...init,
  })
}

export type AdminPromotionSummary = {
  total: number
  active: number
  inactive: number
  /** Active AND today falls within [startDate, endDate] — the API has no server-side filter for this, so it's
   * computed from every currently-active promotion (there are never many at once, same "fetch it all" approach
   * already used for the Categories summary). */
  liveNow: number
}

/** Builds the summary tiles from real counts only — the backend has no dedicated summary endpoint for Promotions
 * (unlike Products/Categories), so this combines the `total` of a few cheap, already-supported queries instead
 * of adding a new API shape. */
export async function fetchAdminPromotionsSummary(init?: RequestInit): Promise<AdminPromotionSummary> {
  const [totalRes, activeRes, inactiveRes] = await Promise.all([
    fetchAdminPromotions({ limit: 1 }, init),
    fetchAdminPromotions({ limit: 1, isActive: true }, init),
    fetchAdminPromotions({ limit: 1, isActive: false }, init),
  ])

  let liveNow = 0
  if (activeRes.total > 0) {
    const activePromotions = await fetchAdminPromotions({ limit: Math.min(activeRes.total, 200), isActive: true }, init)
    const now = Date.now()
    liveNow = activePromotions.items.filter(
      (p) => now >= new Date(p.startDate).getTime() && now <= new Date(p.endDate).getTime()
    ).length
  }

  return { total: totalRes.total, active: activeRes.total, inactive: inactiveRes.total, liveNow }
}

// ---------------------------------------------------------------------------
// Mutations (existing promotion endpoints)
// ---------------------------------------------------------------------------

export type PromotionDraft = {
  code: string
  description: string
  discountType: DiscountType
  /** Kept as a string for the form's Input; parsed to a number right before the request. */
  discountValue: string
  /** yyyy-mm-dd, matching a native date input's value. */
  startDate: string
  endDate: string
  isActive: boolean
}

export const emptyPromotionDraft: PromotionDraft = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  endDate: "",
  isActive: true,
}

export function draftFromPromotion(promotion: AdminPromotionRow): PromotionDraft {
  return {
    code: promotion.code,
    description: promotion.description ?? "",
    discountType: promotion.discountType,
    discountValue: String(promotion.discountValue),
    startDate: promotion.startDate.slice(0, 10),
    endDate: promotion.endDate.slice(0, 10),
    isActive: promotion.isActive,
  }
}

function jsonRequest(method: "POST" | "PATCH" | "DELETE", body?: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }
}

function toPayload(draft: PromotionDraft) {
  return {
    code: draft.code.trim(),
    description: draft.description.trim() || undefined,
    discountType: draft.discountType,
    discountValue: Number(draft.discountValue),
    startDate: draft.startDate,
    endDate: draft.endDate,
    isActive: draft.isActive,
  }
}

/** POST /api/admin/promotions */
export function createAdminPromotion(draft: PromotionDraft) {
  return apiFetch<AdminPromotionRow>("/api/admin/promotions", jsonRequest("POST", toPayload(draft)))
}

/** PATCH /api/admin/promotions/[id] */
export function updateAdminPromotion(id: string, draft: PromotionDraft) {
  return apiFetch<AdminPromotionRow>(`/api/admin/promotions/${id}`, jsonRequest("PATCH", toPayload(draft)))
}

/** DELETE /api/admin/promotions/[id] — soft delete (sets deletedAt); the document stays in MongoDB. */
export function deleteAdminPromotion(id: string) {
  return apiFetch(`/api/admin/promotions/${id}`, jsonRequest("DELETE"))
}
