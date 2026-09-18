import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import Category from "@/models/Category"
import ProductVariant from "@/models/ProductVariant"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { LOW_STOCK_THRESHOLD, deriveProductStatus } from "@/lib/admin-product-status"

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  "name-asc": { name: 1 },
  "price-asc": { price: 1 },
  "price-desc": { price: -1 },
  "stock-asc": { stock: 1 },
  "rating-desc": { rating: -1 },
}

type Condition = Record<string, unknown>

/**
 * GET /api/admin/products — admin only. The admin catalog listing: unlike the
 * public GET /api/products it *includes inactive products* (only soft-deleted
 * ones are hidden), and it also returns category names, the first variant SKU,
 * a derived status, and catalog-wide summary counts for the summary tiles.
 */
export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const conditions: Condition[] = [{ deletedAt: null }]

    const search = searchParams.get("search")?.trim()
    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: "i" }
      // SKUs live on ProductVariant, so a SKU search resolves to product ids first.
      const skuMatches = await ProductVariant.find({ sku: pattern, deletedAt: null }).select("productId").lean()
      conditions.push({
        $or: [
          { name: pattern },
          { slug: pattern },
          { brand: pattern },
          { _id: { $in: skuMatches.map((variant) => variant.productId) } },
        ],
      })
    }

    const categoryId = searchParams.get("categoryId")
    if (categoryId) {
      if (!isValidObjectId(categoryId)) return badRequest("Invalid categoryId.")
      conditions.push({ categoryId })
    }

    const status = searchParams.get("status")
    if (status === "active") conditions.push({ isActive: true, stock: { $gt: 0 } })
    else if (status === "inactive") conditions.push({ isActive: false })
    else if (status === "out-of-stock") conditions.push({ isActive: true, stock: { $lte: 0 } })
    else if (status) return badRequest("Invalid status filter.")

    const stock = searchParams.get("stock")
    if (stock === "healthy") conditions.push({ stock: { $gt: LOW_STOCK_THRESHOLD } })
    else if (stock === "low") conditions.push({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } })
    else if (stock === "out") conditions.push({ stock: { $lte: 0 } })
    else if (stock) return badRequest("Invalid stock filter.")

    const sort = SORT_OPTIONS[searchParams.get("sort") ?? "name-asc"] ?? SORT_OPTIONS["name-asc"]
    const filter = { $and: conditions }
    const base = { deletedAt: null }

    const [items, total, totalAll, active, outOfStock, lowStock] = await Promise.all([
      // `_id` as a tiebreaker keeps pagination stable when many rows share the sort value.
      Product.find(filter).sort({ ...sort, _id: 1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.countDocuments(base),
      Product.countDocuments({ ...base, isActive: true, stock: { $gt: 0 } }),
      Product.countDocuments({ ...base, isActive: true, stock: { $lte: 0 } }),
      Product.countDocuments({ ...base, stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
    ])

    const withImages = await attachPrimaryImages(items)

    const categoryIds = [...new Set(items.map((item) => item.categoryId.toString()))]
    const productIds = items.map((item) => item._id)
    const [categories, variants] = await Promise.all([
      categoryIds.length > 0 ? Category.find({ _id: { $in: categoryIds } }).select("name").lean() : [],
      productIds.length > 0
        ? ProductVariant.find({ productId: { $in: productIds }, deletedAt: null }).sort({ createdAt: 1 }).lean()
        : [],
    ])

    const categoryNameById = new Map(categories.map((category) => [category._id.toString(), category.name]))
    const skuByProduct = new Map<string, string>()
    for (const variant of variants) {
      const key = variant.productId.toString()
      if (variant.sku && !skuByProduct.has(key)) skuByProduct.set(key, variant.sku)
    }

    return ok({
      items: withImages.map((item) => ({
        ...item,
        categoryName: categoryNameById.get(item.categoryId.toString()) ?? null,
        sku: skuByProduct.get(item._id.toString()) ?? null,
        status: deriveProductStatus(item),
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: { total: totalAll, active, outOfStock, lowStock },
    })
  } catch (error) {
    return serverError("GET /api/admin/products failed:", error)
  }
}
