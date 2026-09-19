import type { ApiProductImage } from "@/lib/api-client/types"

/**
 * Neutral placeholder shown only when a product genuinely has no
 * ProductImage rows yet — a missing-asset fallback, not fabricated product
 * content. Stored locally (public/products/placeholders) so it works offline.
 */
export const PLACEHOLDER_PRODUCT_IMAGE = "/products/placeholders/no-image.svg"

/** Only the fields these helpers actually need — callers don't have to supply a full ApiProductImage (e.g. with `_id`/`productId`). */
export type ImageLike = Pick<ApiProductImage, "imageUrl" | "displayOrder" | "isPrimary"> & {
  altText?: string
  variantId?: string | null
}

/** The image to show for a product/variant combination: variant-specific primary, then any variant image, then the product's primary, then its first by display order. */
export function getPrimaryImageUrl(images: ImageLike[], variantId?: string | null): string {
  if (images.length === 0) return PLACEHOLDER_PRODUCT_IMAGE

  if (variantId) {
    const variantPrimary = images.find((image) => image.variantId === variantId && image.isPrimary)
    if (variantPrimary) return variantPrimary.imageUrl
    const variantAny = images.find((image) => image.variantId === variantId)
    if (variantAny) return variantAny.imageUrl
  }

  const primary = images.find((image) => image.isPrimary)
  if (primary) return primary.imageUrl

  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder)
  return sorted[0]?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE
}

/** Full gallery, ordered by displayOrder — falls back to a single placeholder frame when there are no images at all. */
export function getGalleryUrls(images: ImageLike[]): string[] {
  if (images.length === 0) return [PLACEHOLDER_PRODUCT_IMAGE]
  return [...images].sort((a, b) => a.displayOrder - b.displayOrder).map((image) => image.imageUrl)
}
