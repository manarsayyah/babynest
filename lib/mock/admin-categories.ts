import { mockCategories } from "@/lib/mock/categories"
import { shopCatalog } from "@/lib/mock/shop-catalog"

/**
 * Admin-only view of the catalog's categories. Builds on the same
 * `mockCategories` the storefront's "Shop by Category" rail uses (no
 * duplicate category list) and layers on the description/status/created
 * fields the storefront doesn't need — a one-file swap once
 * `models/Category.ts` and a real `/api/admin/categories` endpoint exist.
 */
export type CategoryStatus = "active" | "inactive"

export type AdminCategory = {
  slug: string
  name: string
  image: string
  tintClassName: string
  description: string
  status: CategoryStatus
  /** ISO date the category was created. */
  createdDate: string
  productCount: number
}

const descriptionBySlug: Record<string, string> = {
  clothing: "Comfortable everyday clothing for babies",
  diapers: "Everyday diapering essentials for every stage",
  toys: "Safe and engaging toys for little ones",
  "bath-care": "Baby bath and personal care essentials",
  feeding: "Essentials for baby's mealtime",
  nursery: "Beautiful and practical nursery essentials",
  strollers: "Smooth and reliable rides for every outing",
  "car-seats": "Safety-first seating for every journey",
}

const createdDateBySlug: Record<string, string> = {
  clothing: "2025-01-12",
  diapers: "2025-01-12",
  toys: "2025-02-04",
  "bath-care": "2025-02-18",
  feeding: "2025-03-01",
  nursery: "2025-06-09",
  strollers: "2025-06-22",
  "car-seats": "2025-09-15",
}

/** Categories currently hidden from the storefront, independent of whether they still have products. */
const inactiveSlugs = new Set(["car-seats"])

export const adminCategories: AdminCategory[] = mockCategories.map((category) => ({
  slug: category.slug,
  name: category.name,
  image: category.image,
  tintClassName: category.tintClassName,
  description: descriptionBySlug[category.slug] ?? "",
  status: inactiveSlugs.has(category.slug) ? "inactive" : "active",
  createdDate: createdDateBySlug[category.slug] ?? "2025-01-01",
  productCount: shopCatalog.filter((product) => product.category === category.slug).length,
}))

export function formatCategoryDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
