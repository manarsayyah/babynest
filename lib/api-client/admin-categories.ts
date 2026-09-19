import { apiFetch } from "@/lib/api-client/fetcher"
import { categoryImageFor } from "@/lib/category-images"

export type CategoryStatus = "active" | "inactive"

export const categoryStatusLabel: Record<CategoryStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

export function formatCategoryDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/** Local category image (see lib/category-images.ts): the mapped photo, an admin-set image, or the local no-image placeholder. */
export function categoryImage(category: { slug?: string; name: string; image: string }) {
  return categoryImageFor(category.slug ?? slugifyName(category.name), category.image)
}

/** Lowercase, hyphenated, URL-safe slug from a display name — matches slugSchema on the server. */
export function slugifyName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

/** One category of GET /api/admin/categories, with its real parent, subcategory count and product count. */
export type AdminCategoryRow = {
  _id: string
  name: string
  slug: string
  description: string
  image: string
  status: CategoryStatus
  parentCategoryId: string | null
  parent: { _id: string; name: string } | null
  childCount: number
  /** The category's own non-deleted products (the rule DELETE uses to refuse deleting an in-use category). */
  productCount: number
  createdAt: string
  updatedAt: string
}

export type AdminCategorySummary = {
  total: number
  active: number
  productsAssigned: number
  empty: number
}

/** Every non-deleted category, unfiltered — feeds the parent picker. */
export type AdminCategoryOption = {
  _id: string
  name: string
  slug: string
  parentCategoryId: string | null
}

export type AdminCategoryListResponse = {
  items: AdminCategoryRow[]
  page: number
  limit: number
  total: number
  totalPages: number
  summary: AdminCategorySummary
  options: AdminCategoryOption[]
}

export type AdminCategorySort = "name-asc" | "products-desc" | "products-asc" | "newest"

export type AdminCategoryQuery = {
  page?: number
  limit?: number
  search?: string
  status?: CategoryStatus
  /** A category id, or "null" for top-level categories only. */
  parentCategoryId?: string
  sort?: AdminCategorySort
}

/** GET /api/admin/categories — real categories from MongoDB, including inactive ones (admin session required). */
export async function fetchAdminCategories(
  params: AdminCategoryQuery = {},
  init?: RequestInit
): Promise<AdminCategoryListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminCategoryListResponse>(`/api/admin/categories${query ? `?${query}` : ""}`, {
    cache: "no-store",
    ...init,
  })
}

// ---------------------------------------------------------------------------
// Mutations (existing category endpoints)
// ---------------------------------------------------------------------------

export type CategoryDraft = {
  name: string
  description: string
  image: string
  status: CategoryStatus
  parentCategoryId: string | null
}

function jsonRequest(method: "POST" | "PATCH", body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
}

/** POST /api/categories — the slug is generated from the name by the caller (the form has no slug field). */
export function createAdminCategory(draft: CategoryDraft, slug: string) {
  return apiFetch<{ _id: string }>(
    "/api/categories",
    jsonRequest("POST", {
      name: draft.name,
      slug,
      description: draft.description,
      image: draft.image,
      status: draft.status,
      parentCategoryId: draft.parentCategoryId,
    })
  )
}

/** PATCH /api/categories/[id] — the server rejects self-parenting, unknown parents and circular relationships. */
export function updateAdminCategory(id: string, update: Partial<CategoryDraft>) {
  return apiFetch(`/api/categories/${id}`, jsonRequest("PATCH", update))
}

/**
 * The Categories page shows every matching category at once (no pagination
 * controls), so this reads page after page until the whole filtered set is in.
 * Summary and options come from the first page (they don't depend on paging).
 */
export async function fetchAllAdminCategories(
  params: Omit<AdminCategoryQuery, "page" | "limit"> = {},
  init?: RequestInit
): Promise<AdminCategoryListResponse> {
  const first = await fetchAdminCategories({ ...params, page: 1, limit: 100 }, init)
  const items = [...first.items]
  for (let page = 2; page <= first.totalPages; page++) {
    items.push(...(await fetchAdminCategories({ ...params, page, limit: 100 }, init)).items)
  }
  return { ...first, items, page: 1, limit: items.length, totalPages: 1 }
}

/** Every id that sits below `categoryId` in the tree (children, grandchildren…) — those can't become its parent. */
export function descendantIds(categoryId: string, options: AdminCategoryOption[]): Set<string> {
  const found = new Set<string>()
  const queue = [categoryId]
  while (queue.length > 0) {
    const current = queue.shift()!
    for (const option of options) {
      if (option.parentCategoryId === current && !found.has(option._id)) {
        found.add(option._id)
        queue.push(option._id)
      }
    }
  }
  return found
}
