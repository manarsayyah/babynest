import Product from "@/models/Product"
import Category from "@/models/Category"
import ProductVariant from "@/models/ProductVariant"
import ProductImage from "@/models/ProductImage"
import ProductTag from "@/models/ProductTag"
import Tag from "@/models/Tag"
import { isValidObjectId } from "@/lib/api/object-id"
import { attachPrimaryImages } from "@/lib/api/primary-images"

/**
 * Looks up one non-deleted product by its ObjectId, or by its `slug` when
 * `idOrSlug` isn't a valid ObjectId — shared by GET /api/products/[id] and
 * the server-rendered /products/[slug] page, so both resolve a product
 * with the exact same query and enrichment logic (category, variants,
 * images, tags), never two parallel implementations.
 *
 * Public callers only ever get an active product; `includeInactive` is for
 * admin callers (the admin product editor), who must still reach inactive ones.
 */
export async function getProductDetailByIdOrSlug(idOrSlug: string, options: { includeInactive?: boolean } = {}) {
  const filter = options.includeInactive ? { deletedAt: null } : { deletedAt: null, isActive: true }
  const product = isValidObjectId(idOrSlug)
    ? await Product.findOne({ _id: idOrSlug, ...filter }).lean()
    : await Product.findOne({ slug: idOrSlug, ...filter }).lean()

  if (!product) return null

  const [category, variants, images, productTags] = await Promise.all([
    Category.findOne({ _id: product.categoryId, deletedAt: null }).lean(),
    ProductVariant.find({ productId: product._id, deletedAt: null }).lean(),
    ProductImage.find({ productId: product._id, deletedAt: null }).sort({ displayOrder: 1 }).lean(),
    ProductTag.find({ productId: product._id, deletedAt: null }).lean(),
  ])

  const tagIds = productTags.map((productTag) => productTag.tagId)
  const tags = tagIds.length > 0 ? await Tag.find({ _id: { $in: tagIds }, deletedAt: null }).lean() : []

  return { product, category: category ?? null, variants, images, tags }
}

/** Up to `limit` other non-deleted, active products from the same category, excluding the given product, each with its primary image (if any). */
export async function getRelatedProducts(categoryId: string, excludeProductId: string, limit = 3) {
  const products = await Product.find({
    categoryId,
    _id: { $ne: excludeProductId },
    deletedAt: null,
    isActive: true,
  })
    .limit(limit)
    .lean()

  return attachPrimaryImages(products)
}
