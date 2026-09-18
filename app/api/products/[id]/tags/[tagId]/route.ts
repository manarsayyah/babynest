import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import ProductTag from "@/models/ProductTag"
import { requireAdmin } from "@/lib/api/auth"
import { notFound, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"

type RouteParams = { params: Promise<{ id: string; tagId: string }> }

/** DELETE /api/products/[id]/tags/[tagId] — admin only, soft delete the association. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id, tagId } = await params
    if (!isValidObjectId(id) || !isValidObjectId(tagId)) return notFound()

    await connectToDatabase()

    const productTag = await ProductTag.findOne({ productId: id, tagId, deletedAt: null })
    if (!productTag) return notFound()

    productTag.deletedAt = new Date()
    await productTag.save()

    return ok({ productId: id, tagId })
  } catch (error) {
    return serverError("DELETE /api/products/[id]/tags/[tagId] failed:", error)
  }
}
