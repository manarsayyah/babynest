import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Product from "@/models/Product"
import Review from "@/models/Review"
import User from "@/models/User"
import { auth } from "@/auth"
import { requireUser } from "@/lib/api/auth"
import { findVerifiedPurchaseOrderItemId } from "@/lib/api/review-verification"
import { recalculateProductRating } from "@/lib/api/product-rating"
import { badRequest, conflict, created, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { parsePagination } from "@/lib/api/pagination"
import { createReviewSchema } from "@/lib/validation/review"

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/products/[id]/reviews — public. Only published, non-deleted
 * reviews; reviewer info is limited to first/last name (no email).
 *
 * Additive: when the caller is signed in, `myReview` is their own active
 * review of this product in ANY moderation state (new reviews start as
 * "pending" and aren't in the public list yet), so the UI can show, edit or
 * delete it. It is `null` for anonymous callers and never exposes anyone else's.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams)
    const filter = { productId: id, deletedAt: null, status: "published" as const }

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ])

    const userIds = reviews.map((review) => review.userId)
    const users =
      userIds.length > 0 ? await User.find({ _id: { $in: userIds } }).select("firstName lastName").lean() : []
    const userMap = new Map(users.map((user) => [user._id.toString(), user]))

    const items = reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      comment: review.comment,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
      reviewer: userMap.get(review.userId.toString()) ?? null,
    }))

    const session = await auth()
    const mine = session?.user
      ? await Review.findOne({ userId: session.user.id, productId: id, deletedAt: null }).lean()
      : null
    const myReview = mine
      ? {
          id: mine._id,
          rating: mine.rating,
          comment: mine.comment,
          status: mine.status,
          isVerifiedPurchase: mine.isVerifiedPurchase,
          createdAt: mine.createdAt,
        }
      : null

    return ok({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), myReview })
  } catch (error) {
    return serverError("GET /api/products/[id]/reviews failed:", error)
  }
}

/**
 * POST /api/products/[id]/reviews — any authenticated user may review any
 * non-deleted product (purchase is not required to post a review, only to
 * earn the verified-purchase badge, which is always server-determined).
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const parsed = createReviewSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const product = await Product.findOne({ _id: id, deletedAt: null }).select("_id").lean()
    if (!product) return notFound("Product not found.")

    // One active review per user per product.
    const existing = await Review.findOne({ userId: session.user.id, productId: id, deletedAt: null })
      .select("_id")
      .lean()
    if (existing) return conflict("You have already reviewed this product.")

    const verifiedOrderItemId = await findVerifiedPurchaseOrderItemId(session.user.id, id)

    const review = await Review.create({
      userId: session.user.id,
      productId: id,
      orderItemId: verifiedOrderItemId ?? undefined,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      isVerifiedPurchase: verifiedOrderItemId !== null,
      status: "pending",
    })

    await recalculateProductRating(id)

    return created(review)
  } catch (error) {
    return serverError("POST /api/products/[id]/reviews failed:", error)
  }
}
