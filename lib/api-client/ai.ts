import { apiFetch, ApiRequestError } from "@/lib/api-client/fetcher"
import type { ApiProduct } from "@/lib/api-client/types"

// ---------------------------------------------------------------------------
// Response shapes (POST /api/ai/search, POST /api/ai/assistant, GET /api/ai/recommendations)
// Every product below was re-read from MongoDB by the backend — the model's own text is never trusted.
// ---------------------------------------------------------------------------

type ApiAiResult = { product: ApiProduct; reason: string; score: number }

type ApiAiSearchResponse = { summary: string; isMedicalConcern: boolean; results: ApiAiResult[] }
type ApiAiRecommendationsResponse = { results: ApiAiResult[] }

/** A real catalog product plus the AI's grounded reason and 0-1 score, in the shape the existing cards render. */
export type AiProduct = {
  id: string
  slug: string
  name: string
  image: string | null
  price: number
  rating: number
  reviewCount: number
  /** Rounded 0-100 from the backend's own score — never computed on the client. */
  matchPercent: number
  reason: string
}

function toAiProduct({ product, reason, score }: ApiAiResult): AiProduct {
  return {
    id: product._id,
    slug: product.slug,
    name: product.name,
    image: product.primaryImage?.imageUrl ?? null,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    matchPercent: Math.round(Math.max(0, Math.min(1, score)) * 100),
    reason,
  }
}

const AI_TIMEOUT_MS = 30_000

/** Customer-safe message for any AI failure — never the raw server/provider text. */
export function aiErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Please sign in to use this feature."
    if (err.status === 400) return "Please describe what you're looking for in a little more detail."
  }
  return "Our AI is unavailable right now. Please try again in a moment."
}

export type AiSearchData = { summary: string; isMedicalConcern: boolean; products: AiProduct[] }
export type AiOutcome<T> = { ok: true; data: T } | { ok: false; message: string }

/**
 * POST /api/ai/search — natural-language search over real products. Signed-in searches are logged by the
 * backend itself (from the session); nothing about the user is sent from here.
 */
export async function aiSearch(query: string, limit = 12): Promise<AiOutcome<AiSearchData>> {
  try {
    const data = await apiFetch<ApiAiSearchResponse>("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    })
    return {
      ok: true,
      data: { summary: data.summary, isMedicalConcern: data.isMedicalConcern, products: data.results.map(toAiProduct) },
    }
  } catch (err) {
    return { ok: false, message: aiErrorMessage(err) }
  }
}

/** GET /api/ai/recommendations — the signed-in customer's personalized picks (401 for guests). */
export async function aiRecommendations(): Promise<AiOutcome<AiProduct[]>> {
  try {
    const data = await apiFetch<ApiAiRecommendationsResponse>("/api/ai/recommendations", {
      cache: "no-store",
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    })
    return { ok: true, data: data.results.map(toAiProduct) }
  } catch (err) {
    return { ok: false, message: aiErrorMessage(err) }
  }
}

// ---------------------------------------------------------------------------
// Smart Search "Refine Your Preferences" — UI options (not data) and how they're phrased for the backend.
// ---------------------------------------------------------------------------

export type PreferenceFilters = {
  ageBucketKey: string | null
  maxBudget: number | null
  category: string | null
  tags: Set<string>
}

export const defaultPreferenceFilters: PreferenceFilters = {
  ageBucketKey: "0-6",
  maxBudget: 200,
  category: null,
  tags: new Set(["Safe materials", "Easy to use"]),
}

export const preferenceTagOptions = [
  "Safe materials",
  "Easy to use",
  "Eco-friendly",
  "Budget-friendly",
  "Highly rated",
]

export const budgetOptions = [
  { value: "50", label: "Under $50" },
  { value: "100", label: "Under $100" },
  { value: "200", label: "Under $200" },
  { value: "any", label: "Any budget" },
]

const MAX_QUERY_LENGTH = 300

/**
 * The backend takes a single natural-language `query`, so the sidebar's choices are appended to it as plain
 * text. The AI (not the client) decides how to apply them against the real catalog.
 */
export function buildSearchQuery(
  text: string,
  filters: PreferenceFilters,
  ageLabel: string | null,
  categoryName: string | null
): string {
  const constraints = [
    ageLabel ? `Baby age: ${ageLabel}.` : null,
    filters.maxBudget ? `Budget: under $${filters.maxBudget}.` : null,
    categoryName ? `Category: ${categoryName}.` : null,
    filters.tags.size > 0 ? `Preferences: ${[...filters.tags].join(", ")}.` : null,
  ].filter((part): part is string => part !== null)

  const suffix = constraints.length > 0 ? ` ${constraints.join(" ")}` : ""
  return `${text.trim().slice(0, MAX_QUERY_LENGTH - suffix.length)}${suffix}`.slice(0, MAX_QUERY_LENGTH)
}
