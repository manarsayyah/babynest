import type { ApiProduct } from "@/lib/api-client/types"

/** True when the product has a real local photo (not the stored SVG placeholder art). */
export function hasRealPhoto(product: ApiProduct): boolean {
  const url = product.primaryImage?.imageUrl
  return Boolean(url) && url!.startsWith("/") && !url!.includes("/products/placeholders/")
}

const PRIOR_WEIGHT = 3 // "virtual reviews" pulling thin-review products toward the catalog average

/**
 * Balanced rating: a weighted average of the product's own rating and the pool's average rating, so a single
 * 5-star review does not outrank a product with many reviews. Uses real values only.
 */
function balancedRating(product: ApiProduct, poolAverage: number): number {
  return (
    (product.reviewCount * product.rating + PRIOR_WEIGHT * poolAverage) /
    (product.reviewCount + PRIOR_WEIGHT)
  )
}

/** Top-rated picks: reviewed products with real photos first, ranked by balanced rating, then review count. */
export function pickTopRated(products: ApiProduct[], count: number): ApiProduct[] {
  const reviewed = products.filter((p) => p.reviewCount > 0)
  const average = reviewed.length
    ? reviewed.reduce((sum, p) => sum + p.rating, 0) / reviewed.length
    : 0
  const rank = (a: ApiProduct, b: ApiProduct) =>
    balancedRating(b, average) - balancedRating(a, average) ||
    b.reviewCount - a.reviewCount ||
    a.name.localeCompare(b.name)

  const picks = reviewed.filter(hasRealPhoto).sort(rank).slice(0, count)
  if (picks.length >= count) return picks

  // Not enough qualifying products: fill with the next-best reviewed products, then any real-photo product.
  const taken = new Set(picks.map((p) => p._id))
  const fillers = [
    ...reviewed.filter((p) => !taken.has(p._id)).sort(rank),
    ...products.filter((p) => !taken.has(p._id) && p.reviewCount === 0 && hasRealPhoto(p)),
  ]
  return [...picks, ...fillers].slice(0, count)
}

/** Newest products with real photos first; placeholder-only products only fill any remaining slots. */
export function pickNewest(products: ApiProduct[], count: number): ApiProduct[] {
  const withPhoto = products.filter(hasRealPhoto)
  const rest = products.filter((p) => !hasRealPhoto(p))
  return [...withPhoto, ...rest].slice(0, count)
}
