import { apiFetch } from "@/lib/api-client/fetcher"
import type { ApiCategory } from "@/lib/api-client/types"

/** GET /api/categories — real, active, non-deleted categories. */
export async function fetchCategories(
  params: { parentCategoryId?: string | null } = {},
  init?: RequestInit
): Promise<ApiCategory[]> {
  const searchParams = new URLSearchParams()
  if (params.parentCategoryId !== undefined) {
    searchParams.set("parentCategoryId", params.parentCategoryId ?? "null")
  }
  const query = searchParams.toString()
  return apiFetch<ApiCategory[]>(`/api/categories${query ? `?${query}` : ""}`, init)
}
