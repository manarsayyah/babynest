import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import Category from "@/models/Category"
import ProductTag from "@/models/ProductTag"
import ProductImage from "@/models/ProductImage"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { createProductSchema } from "@/lib/validation/product"
import { getVariantStockSummaries } from "@/lib/api/inventory"

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating_desc: { rating: -1 },
  name_asc: { name: 1 },
}

/** GET /api/products — paginated, filterable public catalog listing. Excludes soft-deleted and inactive products. */
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const filter: Record<string, unknown> = { deletedAt: null, isActive: true }

    const search = searchParams.get("search")
    if (search) filter.name = { $regex: escapeRegex(search), $options: "i" }

    // Accepts either a single id or a comma-separated list (matched via
    // $in) — the storefront's category filter is a multi-select checkbox
    // list, so a single-value-only param couldn't represent "any of these
    // categories" without dropping selections.
    const categoryId = searchParams.get("categoryId")
    if (categoryId) {
      const categoryIds = categoryId.split(",").map((value) => value.trim()).filter(Boolean)
      if (categoryIds.length === 0 || !categoryIds.every(isValidObjectId)) {
        return badRequest("Invalid categoryId.")
      }
      filter.categoryId = categoryIds.length === 1 ? categoryIds[0] : { $in: categoryIds }
    }

    const brand = searchParams.get("brand")
    if (brand) filter.brand = { $regex: `^${escapeRegex(brand)}$`, $options: "i" }

    // Same comma-separated convention as categoryId, for the same reason
    // (the age-range filter is also multi-select).
    const ageGroup = searchParams.get("ageGroup")
    if (ageGroup) {
      const ageGroups = ageGroup.split(",").map((value) => value.trim()).filter(Boolean)
      if (ageGroups.length > 0) {
        filter.ageGroup = ageGroups.length === 1 ? ageGroups[0] : { $in: ageGroups }
      }
    }

    const material = searchParams.get("material")
    if (material) filter.material = { $regex: escapeRegex(material), $options: "i" }

    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {}
      if (minPrice && Number.isFinite(Number(minPrice))) priceFilter.$gte = Number(minPrice)
      if (maxPrice && Number.isFinite(Number(maxPrice))) priceFilter.$lte = Number(maxPrice)
      if (Object.keys(priceFilter).length > 0) filter.price = priceFilter
    }

    const minRating = searchParams.get("minRating")
    if (minRating && Number.isFinite(Number(minRating))) {
      filter.rating = { $gte: Number(minRating) }
    }

    // Availability follows variant stock (what checkout decrements): in stock = some non-deleted variant has
    // units; out of stock = it has variants and none do. A product with no variants falls back to its own
    // `stock`, the same rule the product detail page uses.
    const availability = searchParams.get("availability")
    if (availability === "in-stock" || availability === "out-of-stock") {
      const summaries = await getVariantStockSummaries()
      const withVariants = [...summaries.keys()]
      const inStockIds = [...summaries.entries()].filter(([, s]) => s.totalQty > 0).map(([id]) => id)
      const soldOutIds = [...summaries.entries()].filter(([, s]) => s.totalQty <= 0).map(([id]) => id)
      const and = (filter.$and as unknown[] | undefined) ?? []
      and.push(
        availability === "in-stock"
          ? { $or: [{ _id: { $in: inStockIds } }, { _id: { $nin: withVariants }, stock: { $gt: 0 } }] }
          : { $or: [{ _id: { $in: soldOutIds } }, { _id: { $nin: withVariants }, stock: { $lte: 0 } }] }
      )
      filter.$and = and
    }

    const tagId = searchParams.get("tagId")
    if (tagId) {
      if (!isValidObjectId(tagId)) return badRequest("Invalid tagId.")
      const productTags = await ProductTag.find({ tagId, deletedAt: null }).select("productId").lean()
      filter._id = { $in: productTags.map((pt) => pt.productId) }
    }

    const sort = SORT_OPTIONS[searchParams.get("sort") ?? "newest"] ?? SORT_OPTIONS.newest

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ])

    // One batched lookup for the whole page, not one per product — the
    // grid needs a thumbnail per item, which this endpoint didn't
    // previously expose at all (ProductImage is its own collection).
    const productIds = items.map((item) => item._id)
    const primaryImages =
      productIds.length > 0
        ? await ProductImage.find({ productId: { $in: productIds }, deletedAt: null })
            .sort({ isPrimary: -1, displayOrder: 1 })
            .lean()
        : []
    const primaryImageByProduct = new Map<string, { imageUrl: string; altText?: string }>()
    for (const image of primaryImages) {
      const key = image.productId.toString()
      if (!primaryImageByProduct.has(key)) {
        primaryImageByProduct.set(key, { imageUrl: image.imageUrl, altText: image.altText ?? undefined })
      }
    }

    const itemsWithImage = items.map((item) => ({
      ...item,
      primaryImage: primaryImageByProduct.get(item._id.toString()) ?? null,
    }))

    return ok({
      items: itemsWithImage,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    })
  } catch (error) {
    return serverError("GET /api/products failed:", error)
  }
}

/** POST /api/products — admin only. */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const { categoryId, slug } = parsed.data

    const category = await Category.findOne({ _id: categoryId, deletedAt: null }).select("_id").lean()
    if (!category) return badRequest("categoryId does not reference an existing category.")

    const existingSlug = await Product.findOne({ slug }).select("_id").lean()
    if (existingSlug) return conflict("A product with this slug already exists.")

    // rating/reviewCount are server-computed review aggregates — never client-writable.
    const writable = { ...parsed.data }
    delete writable.rating
    delete writable.reviewCount
    const product = await Product.create(writable)

    return created(product)
  } catch (error) {
    return serverError("POST /api/products failed:", error)
  }
}
