import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Review from "@/models/Review"
import User from "@/models/User"
import Product from "@/models/Product"
import { requireAdmin } from "@/lib/api/auth"
import { recalculateProductRating } from "@/lib/api/product-rating"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { adminUpdateReviewSchema } from "@/lib/validation/review"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/admin/reviews/[id] — admin only, any customer's review. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const review = await Review.findOne({ _id: id, deletedAt: null }).lean()
    if (!review) return notFound()

    const [reviewer, product] = await Promise.all([
      // Admin views may show contact info — still never the password hash.
      User.findOne({ _id: review.userId }).select("firstName lastName email").lean(),
      Product.findOne({ _id: review.productId }).select("name slug").lean(),
    ])

    return ok({ review, reviewer, product })
  } catch (error) {
    return serverError("GET /api/admin/reviews/[id] failed:", error)
  }
}

/**
 * PATCH /api/admin/reviews/[id] — admin only. Moderates `status`, and may
 * correct `rating`/`comment`. `userId`/`productId`/`isVerifiedPurchase`
 * are never part of this schema, so ownership/verification can't change.
 */
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

    const parsed = adminUpdateReviewSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const review = await Review.findOne({ _id: id, deletedAt: null })
    if (!review) return notFound()

    Object.assign(review, parsed.data)
    await review.save()

    await recalculateProductRating(review.productId.toString())

    return ok(review.toObject())
  } catch (error) {
    return serverError("PATCH /api/admin/reviews/[id] failed:", error)
  }
}
