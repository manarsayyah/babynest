import { apiFetch } from "@/lib/api-client/fetcher"
import type { ProductListResponse } from "@/lib/api-client/types"

export type ProductQueryParams = {
  page?: number
  limit?: number
  search?: string
  categoryId?: string | string[]
  ageGroup?: string | string[]
  brand?: string
  material?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  availability?: "in-stock" | "out-of-stock"
  tagId?: string
  sort?: "newest" | "price_asc" | "price_desc" | "rating_desc" | "name_asc"
}

function toQueryString(params: ProductQueryParams): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      searchParams.set(key, value.join(","))
    } else {
      searchParams.set(key, String(value))
    }
  }

  return searchParams.toString()
}

/** GET /api/products — the real catalog listing, with the same filters/sort/pagination the backend supports. */
export async function fetchProducts(
  params: ProductQueryParams = {},
  init?: RequestInit
): Promise<ProductListResponse> {
  const query = toQueryString(params)
  return apiFetch<ProductListResponse>(`/api/products${query ? `?${query}` : ""}`, init)
}
