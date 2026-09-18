import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import ProductVariant from "@/models/ProductVariant"
import ProductImage from "@/models/ProductImage"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateProductImageSchema } from "@/lib/validation/product-image"

type RouteParams = { params: Promise<{ id: string }> }

/** PATCH /api/images/[id] — admin only. */
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

    const parsed = updateProductImageSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const image = await ProductImage.findOne({ _id: id, deletedAt: null })
    if (!image) return notFound()

    const { variantId } = parsed.data
    if (variantId) {
      // Ownership check — the variant must belong to the same product this image belongs to.
      const variant = await ProductVariant.findOne({
        _id: variantId,
        productId: image.productId,
        deletedAt: null,
      })
        .select("_id")
        .lean()
      if (!variant) return badRequest("variantId does not reference a variant of this product.")
    }

    Object.assign(image, parsed.data)
    await image.save()

    return ok(image.toObject())
  } catch (error) {
    return serverError("PATCH /api/images/[id] failed:", error)
  }
}

/** DELETE /api/images/[id] — admin only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const image = await ProductImage.findOne({ _id: id, deletedAt: null })
    if (!image) return notFound()

    image.deletedAt = new Date()
    await image.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/images/[id] failed:", error)
  }
}
