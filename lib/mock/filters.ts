import { mockCategories } from "@/lib/mock/categories"
import { shopCatalog, type ShopProduct } from "@/lib/mock/shop-catalog"

/** Category filter options, with live counts derived from the mock catalog. */
export function getCategoryFilterOptions() {
  return mockCategories.map((category) => ({
    slug: category.slug,
    name: category.name,
    count: shopCatalog.filter((product) => product.category === category.slug).length,
  }))
}

export type AgeBucket = { key: string; label: string; min: number; max: number }

export const ageBuckets: AgeBucket[] = [
  { key: "0-6", label: "0-6 Months", min: 0, max: 6 },
  { key: "6-12", label: "6-12 Months", min: 6, max: 12 },
  { key: "1-2", label: "1-2 Years", min: 12, max: 24 },
  { key: "3+", label: "3+ Years", min: 36, max: 999 },
]

export function ageBucketMatches(bucket: AgeBucket, product: ShopProduct) {
  return product.ageRangeMonths.min <= bucket.max && product.ageRangeMonths.max >= bucket.min
}

export const ratingOptions = [4, 3, 2] as const

export const priceBounds: [number, number] = [0, 500]
