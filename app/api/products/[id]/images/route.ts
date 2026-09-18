import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import ProductVariant from "@/models/ProductVariant"
import ProductImage from "@/models/ProductImage"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, created, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { createProductImageSchema } from "@/lib/validation/product-image"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/products/[id]/images — non-deleted images, ordered by displayOrder. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const images = await ProductImage.find({ productId: id, deletedAt: null }).sort({ displayOrder: 1 }).lean()
    return ok(images)
  } catch (error) {
    return serverError("GET /api/products/[id]/images failed:", error)
  }
}

/** POST /api/products/[id]/images — admin only. */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const parsed = createProductImageSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const product = await Product.findOne({ _id: id, deletedAt: null }).select("_id").lean()
    if (!product) return notFound("Product not found.")

    const { variantId } = parsed.data
    if (variantId) {
      // Ownership check — the variant must belong to this same product.
      const variant = await ProductVariant.findOne({ _id: variantId, productId: id, deletedAt: null })
        .select("_id")
        .lean()
      if (!variant) return badRequest("variantId does not reference a variant of this product.")
    }

    const image = await ProductImage.create({ ...parsed.data, productId: id })

    return created(image)
  } catch (error) {
    return serverError("POST /api/products/[id]/images failed:", error)
  }
}
