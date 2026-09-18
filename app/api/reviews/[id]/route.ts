import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Review from "@/models/Review"
import { requireUser } from "@/lib/api/auth"
import { recalculateProductRating } from "@/lib/api/product-rating"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updateReviewSchema } from "@/lib/validation/review"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/reviews/[id] — the authenticated user's own review only. Never another customer's. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const review = await Review.findOne({ _id: id, userId: session.user.id, deletedAt: null }).lean()
    if (!review) return notFound()

    return ok(review)
  } catch (error) {
    return serverError("GET /api/reviews/[id] failed:", error)
  }
}

/**
 * PATCH /api/reviews/[id] — only `rating`/`comment` are editable by the
 * owner. `userId`, `productId`, `isVerifiedPurchase`, and `status` are never
 * part of this schema, so they can never change here.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = updateReviewSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const review = await Review.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!review) return notFound()

    Object.assign(review, parsed.data)
    await review.save()

    await recalculateProductRating(review.productId.toString())

    return ok(review.toObject())
  } catch (error) {
    return serverError("PATCH /api/reviews/[id] failed:", error)
  }
}

/** DELETE /api/reviews/[id] — owner only, soft delete. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const review = await Review.findOne({ _id: id, userId: session.user.id, deletedAt: null })
    if (!review) return notFound()

    review.deletedAt = new Date()
    await review.save()

    await recalculateProductRating(review.productId.toString())

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/reviews/[id] failed:", error)
  }
}
