/**
 * Shapes returned by the real backend API (app/api/**), consumed by the
 * frontend integration layer. Kept intentionally close to what each route
 * actually returns today (see app/api/products/route.ts and
 * app/api/products/[id]/route.ts) rather than the full Mongoose document
 * shape, since the frontend only ever sees the JSON response.
 */

export type ApiCategory = {
  _id: string
  name: string
  slug: string
  description?: string
  parentCategoryId?: string | null
  image?: string
  tintClassName?: string
  status: "active" | "inactive"
}

export type ApiProductImageRef = {
  imageUrl: string
  altText?: string
}

export type ApiProduct = {
  _id: string
  name: string
  slug: string
  description?: string
  price: number
  stock: number
  categoryId: string
  brand?: string
  material?: string
  ageGroup?: string
  rating: number
  reviewCount: number
  isActive: boolean
  /** Present on endpoints that batch-attach it (GET /api/products, GET /api/wishlist) — the product's primary/first image, if any. */
  primaryImage?: ApiProductImageRef | null
}

export type ApiProductVariant = {
  _id: string
  productId: string
  sku?: string
  variantName?: string
  color?: string
  size?: string
  priceDelta: number
  stockQty: number
}

export type ApiProductImage = {
  _id: string
  productId: string
  variantId?: string | null
  imageUrl: string
  altText?: string
  displayOrder: number
  isPrimary: boolean
}

export type ApiTag = {
  _id: string
  name: string
  slug: string
}

export type ProductListResponse = {
  items: ApiProduct[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ProductDetailResponse = ApiProduct & {
  category: ApiCategory | null
  variants: ApiProductVariant[]
  images: ApiProductImage[]
  tags: ApiTag[]
}

export type ApiWishlistItem = {
  id: string
  productId: string
  addedAt: string
  product: ApiProduct
}

export type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: unknown }

export type ApiCartItemAvailability = "available" | "insufficient_stock" | "out_of_stock" | "unavailable"

export type ApiCartItem = {
  id: string
  variantId: string
  quantity: number
  unitPrice: number
  lineTotal: number
  availability: ApiCartItemAvailability
  image: string | null
  variant: {
    id: string
    sku?: string
    variantName?: string
    color?: string
    size?: string
    stockQty: number
  } | null
  product: { id: string; name: string; slug: string; price: number } | null
}

/** GET /api/cart — every figure here is computed server-side. */
export type ApiCart = {
  cartId: string | null
  items: ApiCartItem[]
  itemCount: number
  subtotal: number
  shipping: number
  total: number
  freeShippingThreshold: number
  hasUnavailableItems: boolean
}
