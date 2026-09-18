import type { Types } from "mongoose"
import ProductImage from "@/models/ProductImage"

/**
 * Attaches each product's primary (or lowest-displayOrder) image in one
 * batched query — shared by every place that needs a product's thumbnail
 * (catalog list, related products, wishlist) so there's a single
 * implementation instead of duplicating the same lookup per route.
 */
export async function attachPrimaryImages<T extends { _id: Types.ObjectId }>(products: T[]) {
  const productIds = products.map((product) => product._id)
  const images =
    productIds.length > 0
      ? await ProductImage.find({ productId: { $in: productIds }, deletedAt: null })
          .sort({ isPrimary: -1, displayOrder: 1 })
          .lean()
      : []

  const byProduct = new Map<string, { imageUrl: string; altText?: string }>()
  for (const image of images) {
    const key = image.productId.toString()
    if (!byProduct.has(key)) {
      byProduct.set(key, { imageUrl: image.imageUrl, altText: image.altText ?? undefined })
    }
  }

  return products.map((product) => ({
    ...product,
    primaryImage: byProduct.get(product._id.toString()) ?? null,
  }))
}
