import Product from "@/models/Product"
import Category from "@/models/Category"
import ProductTag from "@/models/ProductTag"
import Tag from "@/models/Tag"

export type ProductCandidate = {
  id: string
  name: string
  brand?: string | null
  material?: string | null
  ageGroup?: string | null
  price: number
  rating: number
  reviewCount: number
  stock: number
  categoryName?: string
  tags: string[]
}

const CANDIDATE_POOL_LIMIT = 150

/**
 * Real, active, non-deleted products only — this is the entire universe
 * the AI is allowed to choose from. Capped at 150 (by popularity) to keep
 * the prompt a reasonable size; every field here comes straight from the
 * database, never from the AI.
 */
export async function getCandidateProducts(options: { excludeProductIds?: string[] } = {}): Promise<
  ProductCandidate[]
> {
  const filter: Record<string, unknown> = { deletedAt: null, isActive: true }
  if (options.excludeProductIds && options.excludeProductIds.length > 0) {
    filter._id = { $nin: options.excludeProductIds }
  }

  const products = await Product.find(filter)
    .sort({ reviewCount: -1, rating: -1 })
    .limit(CANDIDATE_POOL_LIMIT)
    .lean()

  if (products.length === 0) return []

  const categoryIds = Array.from(new Set(products.map((p) => p.categoryId.toString())))
  const categories = await Category.find({ _id: { $in: categoryIds } }).select("name").lean()
  const categoryNameMap = new Map(categories.map((c) => [c._id.toString(), c.name]))

  const productIds = products.map((p) => p._id)
  const productTags = await ProductTag.find({ productId: { $in: productIds }, deletedAt: null }).lean()
  const tagIds = Array.from(new Set(productTags.map((pt) => pt.tagId.toString())))
  const tags = tagIds.length > 0 ? await Tag.find({ _id: { $in: tagIds }, deletedAt: null }).select("name").lean() : []
  const tagNameMap = new Map(tags.map((t) => [t._id.toString(), t.name]))

  const tagsByProduct = new Map<string, string[]>()
  for (const productTag of productTags) {
    const tagName = tagNameMap.get(productTag.tagId.toString())
    if (!tagName) continue
    const key = productTag.productId.toString()
    const list = tagsByProduct.get(key) ?? []
    list.push(tagName)
    tagsByProduct.set(key, list)
  }

  return products.map((product) => ({
    id: product._id.toString(),
    name: product.name,
    brand: product.brand,
    material: product.material,
    ageGroup: product.ageGroup,
    price: product.price,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    categoryName: categoryNameMap.get(product.categoryId.toString()),
    tags: tagsByProduct.get(product._id.toString()) ?? [],
  }))
}
