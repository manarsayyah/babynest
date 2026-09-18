import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import ProductVariant from "@/models/ProductVariant"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateVariantSchema } from "@/lib/validation/variant"

type RouteParams = { params: Promise<{ id: string }> }

/** PATCH /api/variants/[id] — admin only. */
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

    const parsed = updateVariantSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const variant = await ProductVariant.findOne({ _id: id, deletedAt: null })
    if (!variant) return notFound()

    Object.assign(variant, parsed.data)
    await variant.save()

    return ok(variant.toObject())
  } catch (error) {
    if ((error as { code?: number }).code === 11000) return conflict("A variant with this SKU already exists.")
    return serverError("PATCH /api/variants/[id] failed:", error)
  }
}

/** DELETE /api/variants/[id] — admin only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const variant = await ProductVariant.findOne({ _id: id, deletedAt: null })
    if (!variant) return notFound()

    variant.deletedAt = new Date()
    await variant.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/variants/[id] failed:", error)
  }
}
