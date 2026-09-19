import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import Category from "@/models/Category"
import { auth } from "@/auth"
import { requireAdmin } from "@/lib/api/auth"
import { getProductDetailByIdOrSlug } from "@/lib/api/product-detail"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateProductSchema } from "@/lib/validation/product"

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/products/[id] — one non-deleted product with its category,
 * variants, images, and tags. `id` may be either the product's ObjectId or
 * its slug (the storefront's /products/[slug] page resolves products by
 * slug, not id — see getProductDetailByIdOrSlug). Inactive products are 404 for
 * everyone but a signed-in admin (the admin editor loads them through here).
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    await connectToDatabase()

    const session = await auth()
    const result = await getProductDetailByIdOrSlug(id, { includeInactive: session?.user?.role === "admin" })
    if (!result) return notFound()

    return ok({
      ...result.product,
      category: result.category,
      variants: result.variants,
      images: result.images,
      tags: result.tags,
    })
  } catch (error) {
    return serverError("GET /api/products/[id] failed:", error)
  }
}

/** PATCH /api/products/[id] — admin only. Only business fields from updateProductSchema are ever writable. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const existing = await Product.findOne({ _id: id, deletedAt: null })
    if (!existing) return notFound()

    const { categoryId, slug } = parsed.data

    if (categoryId) {
      const category = await Category.findOne({ _id: categoryId, deletedAt: null }).select("_id").lean()
      if (!category) return badRequest("categoryId does not reference an existing category.")
    }

    if (slug && slug !== existing.slug) {
      const slugTaken = await Product.findOne({ slug, _id: { $ne: id } }).select("_id").lean()
      if (slugTaken) return conflict("A product with this slug already exists.")
    }

    // rating/reviewCount are server-computed review aggregates — never client-writable.
    const writable = { ...parsed.data }
    delete writable.rating
    delete writable.reviewCount
    Object.assign(existing, writable)
    await existing.save()

    return ok(existing.toObject())
  } catch (error) {
    return serverError("PATCH /api/products/[id] failed:", error)
  }
}

/** DELETE /api/products/[id] — admin only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const product = await Product.findOne({ _id: id, deletedAt: null })
    if (!product) return notFound()

    product.deletedAt = new Date()
    await product.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/products/[id] failed:", error)
  }
}
