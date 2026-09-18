import { apiFetch } from "@/lib/api-client/fetcher"

export type ReviewStatus = "pending" | "published" | "hidden"

export type ApiReview = {
  id: string
  rating: number
  comment: string
  isVerifiedPurchase: boolean
  createdAt: string
  reviewer: { firstName?: string; lastName?: string } | null
}

/** The signed-in caller's own review of a product, in any moderation state. */
export type MyReview = {
  id: string
  rating: number
  comment: string
  status: ReviewStatus
  isVerifiedPurchase: boolean
  createdAt: string
}

export type ReviewsPage = {
  items: ApiReview[]
  page: number
  totalPages: number
  total: number
  myReview: MyReview | null
}

/** GET /api/products/[id]/reviews — public published reviews (+ the caller's own review when signed in). */
export async function fetchProductReviews(productId: string, page = 1, limit = 10): Promise<ReviewsPage> {
  return apiFetch<ReviewsPage>(`/api/products/${productId}/reviews?page=${page}&limit=${limit}`, {
    cache: "no-store",
  })
}

/** POST /api/products/[id]/reviews — userId, verified-purchase status and moderation state are all server-side. */
export async function createReview(productId: string, input: { rating: number; comment: string }): Promise<void> {
  await apiFetch(`/api/products/${productId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}

/** PATCH /api/reviews/[id] — owner only; only rating and comment are editable. */
export async function updateReview(id: string, input: { rating: number; comment: string }): Promise<void> {
  await apiFetch(`/api/reviews/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
}

/** DELETE /api/reviews/[id] — owner only, soft delete. */
export async function deleteReview(id: string): Promise<void> {
  await apiFetch(`/api/reviews/${id}`, { method: "DELETE" })
}

export function reviewerName(reviewer: ApiReview["reviewer"]): string {
  const name = [reviewer?.firstName, reviewer?.lastName].filter(Boolean).join(" ")
  return name || "BabyNest customer"
}
