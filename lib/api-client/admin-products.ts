import { apiFetch } from "@/lib/api-client/fetcher"
import type { ApiProduct, ApiTag, ProductDetailResponse } from "@/lib/api-client/types"
import type { AdminProductStatus } from "@/lib/admin-product-status"

/** One row of GET /api/admin/products — a real Product plus the server-derived fields the table shows. */
export type AdminProductRow = ApiProduct & {
  categoryName: string | null
  /** First variant's SKU, if the product has any variants with one (SKUs live on ProductVariant, not Product). */
  sku: string | null
  status: AdminProductStatus
}

export type AdminProductSummary = {
  total: number
  active: number
  outOfStock: number
  lowStock: number
}

export type AdminProductListResponse = {
  items: AdminProductRow[]
  page: number
  limit: number
  total: number
  totalPages: number
  summary: AdminProductSummary
}

export type AdminProductStockFilter = "healthy" | "low" | "out"
export type AdminProductSort = "name-asc" | "price-asc" | "price-desc" | "stock-asc" | "rating-desc"

export type AdminProductQuery = {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  status?: AdminProductStatus
  stock?: AdminProductStockFilter
  sort?: AdminProductSort
}

/** GET /api/admin/products — real catalog including inactive products (admin session required). */
export async function fetchAdminProducts(
  params: AdminProductQuery = {},
  init?: RequestInit
): Promise<AdminProductListResponse> {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    searchParams.set(key, String(value))
  }
  const query = searchParams.toString()
  return apiFetch<AdminProductListResponse>(`/api/admin/products${query ? `?${query}` : ""}`, init)
}

/** GET /api/products/[id] — one product with its variants, images and tags (works for inactive products too). */
export function fetchAdminProductDetail(id: string): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/api/products/${id}`)
}

/** GET /api/tags — every real tag, for the tag picker. */
export function fetchAllTags(): Promise<ApiTag[]> {
  return apiFetch<ApiTag[]>("/api/tags")
}

// ---------------------------------------------------------------------------
// Form draft ↔ API mapping
// ---------------------------------------------------------------------------

export type VariantDraft = {
  /** Present only for a variant that already exists in MongoDB — its absence means "create". */
  id?: string
  sku: string
  variantName: string
  color: string
  size: string
  priceDelta: string
  stockQty: string
}

export type ImageDraft = {
  /** Present only for an image that already exists in MongoDB — its absence means "create". */
  id?: string
  imageUrl: string
  altText: string
  isPrimary: boolean
}

export type ProductDraft = {
  name: string
  slug: string
  description: string
  brand: string
  material: string
  ageGroup: string
  categoryId: string
  price: string
  stock: string
  isActive: boolean
  variants: VariantDraft[]
  images: ImageDraft[]
  tagIds: string[]
}

export const emptyProductDraft: ProductDraft = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  material: "",
  ageGroup: "",
  categoryId: "",
  price: "",
  stock: "0",
  isActive: true,
  variants: [],
  images: [],
  tagIds: [],
}

export function draftFromDetail(detail: ProductDetailResponse): ProductDraft {
  return {
    name: detail.name,
    slug: detail.slug,
    description: detail.description ?? "",
    brand: detail.brand ?? "",
    material: detail.material ?? "",
    ageGroup: detail.ageGroup ?? "",
    categoryId: detail.categoryId,
    price: String(detail.price),
    stock: String(detail.stock),
    isActive: detail.isActive,
    variants: detail.variants.map((variant) => ({
      id: variant._id,
      sku: variant.sku ?? "",
      variantName: variant.variantName ?? "",
      color: variant.color ?? "",
      size: variant.size ?? "",
      priceDelta: String(variant.priceDelta),
      stockQty: String(variant.stockQty),
    })),
    images: detail.images.map((image) => ({
      id: image._id,
      imageUrl: image.imageUrl,
      altText: image.altText ?? "",
      isPrimary: image.isPrimary,
    })),
    tagIds: detail.tags.map((tag) => tag._id),
  }
}

function jsonRequest(method: "POST" | "PATCH" | "DELETE", body?: unknown): RequestInit {
  return {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  }
}

function numberOr(value: string, fallback: number) {
  const trimmed = value.trim()
  return trimmed === "" ? fallback : Number(trimmed)
}

/** Product fields exactly as createProductSchema/updateProductSchema allow them — never rating/reviewCount/deletedAt. */
function productPayload(draft: ProductDraft, forUpdate: boolean) {
  const optional = (value: string) => {
    const trimmed = value.trim()
    // On update, an empty string clears the field; on create it is simply omitted.
    return trimmed === "" && !forUpdate ? undefined : trimmed
  }

  return {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    description: optional(draft.description),
    brand: optional(draft.brand),
    material: optional(draft.material),
    ageGroup: optional(draft.ageGroup),
    categoryId: draft.categoryId,
    price: Number(draft.price),
    stock: numberOr(draft.stock, 0),
    isActive: draft.isActive,
  }
}

function variantPayload(variant: VariantDraft) {
  return {
    sku: variant.sku.trim() || undefined,
    variantName: variant.variantName.trim() || undefined,
    color: variant.color.trim() || undefined,
    size: variant.size.trim() || undefined,
    priceDelta: numberOr(variant.priceDelta, 0),
    stockQty: numberOr(variant.stockQty, 0),
  }
}

function imagePayload(image: ImageDraft, displayOrder: number) {
  return {
    imageUrl: image.imageUrl.trim(),
    altText: image.altText.trim() || undefined,
    displayOrder,
    isPrimary: image.isPrimary,
  }
}

/** Exactly one image is primary: keep the first flagged one, or fall back to the first image. */
function withSinglePrimary(images: ImageDraft[]): ImageDraft[] {
  if (images.length === 0) return images
  const primaryIndex = Math.max(0, images.findIndex((image) => image.isPrimary))
  return images.map((image, index) => ({ ...image, isPrimary: index === primaryIndex }))
}

export type SaveProductResult = {
  productId: string
  /** Human-readable list of related-record steps (variants/images/tags) that failed after the product itself was saved. */
  failures: string[]
}

async function settle(label: string, tasks: Array<() => Promise<unknown>>, failures: string[]) {
  const results = await Promise.allSettled(tasks.map((task) => task()))
  results.forEach((result) => {
    if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : "Unknown error"
      failures.push(`${label}: ${reason}`)
    }
  })
}

/**
 * POST /api/products, then its variants/images/tags through their own
 * endpoints. The product request is the only one that throws — once the
 * product exists, later failures are collected so a retry can't create a
 * duplicate product.
 */
export async function createAdminProduct(draft: ProductDraft): Promise<SaveProductResult> {
  const product = await apiFetch<{ _id: string }>("/api/products", jsonRequest("POST", productPayload(draft, false)))
  const productId = product._id
  const failures: string[] = []

  await settle(
    "Variant",
    draft.variants.map((variant) => () =>
      apiFetch(`/api/products/${productId}/variants`, jsonRequest("POST", variantPayload(variant)))
    ),
    failures
  )
  await settle(
    "Image",
    withSinglePrimary(draft.images).map((image, index) => () =>
      apiFetch(`/api/products/${productId}/images`, jsonRequest("POST", imagePayload(image, index)))
    ),
    failures
  )
  await settle(
    "Tag",
    draft.tagIds.map((tagId) => () => apiFetch(`/api/products/${productId}/tags`, jsonRequest("POST", { tagId }))),
    failures
  )

  return { productId, failures }
}

/**
 * PATCH /api/products/[id], then reconcile variants/images/tags against what
 * MongoDB currently holds (`original`): existing rows (by id) are PATCHed,
 * new rows POSTed, removed rows soft-deleted, tags added/removed — so no
 * record is ever duplicated or silently orphaned.
 */
export async function updateAdminProduct(
  productId: string,
  draft: ProductDraft,
  original: ProductDetailResponse
): Promise<SaveProductResult> {
  await apiFetch(`/api/products/${productId}`, jsonRequest("PATCH", productPayload(draft, true)))
  const failures: string[] = []

  const keptVariantIds = new Set(draft.variants.flatMap((variant) => (variant.id ? [variant.id] : [])))
  await settle(
    "Variant",
    [
      ...original.variants
        .filter((variant) => !keptVariantIds.has(variant._id))
        .map((variant) => () => apiFetch(`/api/variants/${variant._id}`, jsonRequest("DELETE"))),
      ...draft.variants.map((variant) => () =>
        variant.id
          ? apiFetch(`/api/variants/${variant.id}`, jsonRequest("PATCH", variantPayload(variant)))
          : apiFetch(`/api/products/${productId}/variants`, jsonRequest("POST", variantPayload(variant)))
      ),
    ],
    failures
  )

  const images = withSinglePrimary(draft.images)
  const keptImageIds = new Set(images.flatMap((image) => (image.id ? [image.id] : [])))
  await settle(
    "Image",
    [
      ...original.images
        .filter((image) => !keptImageIds.has(image._id))
        .map((image) => () => apiFetch(`/api/images/${image._id}`, jsonRequest("DELETE"))),
      ...images.map((image, index) => () =>
        image.id
          ? apiFetch(`/api/images/${image.id}`, jsonRequest("PATCH", imagePayload(image, index)))
          : apiFetch(`/api/products/${productId}/images`, jsonRequest("POST", imagePayload(image, index)))
      ),
    ],
    failures
  )

  const originalTagIds = new Set(original.tags.map((tag) => tag._id))
  const nextTagIds = new Set(draft.tagIds)
  await settle(
    "Tag",
    [
      ...[...originalTagIds]
        .filter((tagId) => !nextTagIds.has(tagId))
        .map((tagId) => () => apiFetch(`/api/products/${productId}/tags/${tagId}`, jsonRequest("DELETE"))),
      ...[...nextTagIds]
        .filter((tagId) => !originalTagIds.has(tagId))
        .map((tagId) => () => apiFetch(`/api/products/${productId}/tags`, jsonRequest("POST", { tagId }))),
    ],
    failures
  )

  return { productId, failures }
}

/** PATCH /api/products/[id] { isActive } — deactivate hides the product from the storefront; activate restores it. */
export function setAdminProductActive(productId: string, isActive: boolean) {
  return apiFetch(`/api/products/${productId}`, jsonRequest("PATCH", { isActive }))
}

/** DELETE /api/products/[id] — soft delete (sets deletedAt); the document stays in MongoDB. */
export function deleteAdminProduct(productId: string) {
  return apiFetch(`/api/products/${productId}`, jsonRequest("DELETE"))
}
