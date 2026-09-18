import { shopCatalog } from "@/lib/mock/shop-catalog"
import { mockCategories } from "@/lib/mock/categories"

/**
 * Admin-only view of the catalog. Builds on the same `shopCatalog` the
 * storefront uses (no duplicate product list) and layers on the
 * inventory/status fields the storefront doesn't need — a one-file swap
 * once `models/Product.ts` and a real `/api/admin/products` endpoint exist.
 */
export type AdminProductStatus = "active" | "draft" | "out-of-stock"

export type AdminProduct = {
  id: string
  slug: string
  sku: string
  name: string
  image: string
  category: string
  categoryLabel: string
  price: number
  stock: number
  status: AdminProductStatus
  rating: number
  reviewCount: number
}

export const LOW_STOCK_THRESHOLD = 10

/** Hand-picked so the table shows a realistic mix of stock levels. */
const stockOverrides: Record<string, number> = {
  sp4: 0,
  sp6: 4,
  sp9: 0,
  sp12: 7,
  sp17: 0,
  sp24: 9,
}

/** A couple of unpublished listings, independent of stock level. */
const draftIds = new Set(["sp15", "sp21"])

const categoryLabelBySlug = new Map(mockCategories.map((category) => [category.slug, category.name]))

function skuFor(id: string, category: string) {
  const numericPart = id.replace(/\D/g, "").padStart(3, "0")
  return `BN-${category.slice(0, 3).toUpperCase()}-${numericPart}`
}

function statusFor(id: string, stock: number): AdminProductStatus {
  if (stock === 0) return "out-of-stock"
  if (draftIds.has(id)) return "draft"
  return "active"
}

export const adminProducts: AdminProduct[] = shopCatalog.map((product, index) => {
  const stock = stockOverrides[product.id] ?? 20 + ((index * 11) % 130)

  return {
    id: product.id,
    slug: product.slug,
    sku: skuFor(product.id, product.category),
    name: product.name,
    image: product.image,
    category: product.category,
    categoryLabel: categoryLabelBySlug.get(product.category) ?? product.category,
    price: product.price,
    stock,
    status: statusFor(product.id, stock),
    rating: product.rating,
    reviewCount: product.reviewCount,
  }
})

export const adminProductCategoryOptions = mockCategories.map((category) => ({
  value: category.slug,
  label: category.name,
}))
