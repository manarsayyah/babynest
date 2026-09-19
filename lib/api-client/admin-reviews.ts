import { apiFetch } from "@/lib/api-client/fetcher"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import { avatarForId } from "@/lib/avatars"

export type ReviewStatus = "pending" | "published" | "hidden"

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  published: "Published",
  pending: "Pending",
  hidden: "Hidden",
}

export function formatReviewDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** Local avatar (public/avatars) — a tone picked from the customer id so it's stable. */
export function reviewerAvatar(customer: { id: string; name: string } | null) {
  return avatarForId(customer?.id)
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/** One review of GET /api/admin/reviews, with its real reviewer and product. */
export type AdminReviewRow = {
  _id: string
  rating: number
  comment: string
  status: ReviewStatus
  isVerifiedPurchase: boolean
  createdAt: string
  updatedAt: string
  customer: { id: string; name: string; email: string } | null
  product: { id: string; name: string; slug: string; image: string | null } | null
}

export function reviewProductImage(review: AdminReviewRow) {
  return review.product?.image ?? PLACEHOLDER_PRODUCT_IMAGE
}

export type AdminReviewSummary = {
  total: number
  published: number
  pending: number
  hidden: number
  averageRating: number
}

export type AdminReviewListResponse = {
  items: AdminReviewRow[]
  page: number
  limit: number
  total: number
  totalPages: number
  summary: AdminReviewSummary
  /** Products that have at least one review — the product filter's choices. */
  productOptions: { _id: string; name: string; slug: string }[]
}

export type AdminReviewSort = "newest" | "oldest" | "rating-desc" | "rating-asc"

export type AdminReviewQuery = {
  page?: number
  limit?: number
  search?: string
  status?: ReviewStatus
  productId?: string
  rating?: number
  sort?: AdminReviewSort
}

/** GET /api/admin/reviews — real reviews from MongoDB (admin session required). */
export async function fetchAdminReviews(
  params: AdminReviewQuery = {},
  init?: RequestInit
): Promise<AdminReviewListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminReviewListResponse>(`/api/admin/reviews${query ? `?${query}` : ""}`, {
    cache: "no-store",
    ...init,
  })
}

// ---------------------------------------------------------------------------
// Moderation (existing PATCH/DELETE admin endpoints)
// ---------------------------------------------------------------------------

/** PATCH /api/admin/reviews/[id] { status } — publish / hide; the server recalculates the product's rating. */
export function updateAdminReviewStatus(id: string, status: ReviewStatus) {
  return apiFetch(`/api/admin/reviews/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
}

/** DELETE /api/admin/reviews/[id] — soft delete (sets deletedAt); the server recalculates the product's rating. */
export function deleteAdminReview(id: string) {
  return apiFetch(`/api/admin/reviews/${id}`, { method: "DELETE" })
}
