import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import WishlistItem from "@/models/WishlistItem"
import { requireUser } from "@/lib/api/auth"
import { notFound, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"

type RouteParams = { params: Promise<{ productId: string }> }

/** DELETE /api/wishlist/[productId] — soft-deletes only the caller's own entry for that product. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { productId } = await params
    if (!isValidObjectId(productId)) return notFound()

    await connectToDatabase()

    const item = await WishlistItem.findOne({ userId: session.user.id, productId, deletedAt: null })
    if (!item) return notFound()

    item.deletedAt = new Date()
    await item.save()

    return ok({ productId })
  } catch (error) {
    return serverError("DELETE /api/wishlist/[productId] failed:", error)
  }
}
