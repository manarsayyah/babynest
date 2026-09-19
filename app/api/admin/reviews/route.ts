import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Review from "@/models/Review"
import User from "@/models/User"
import Product from "@/models/Product"
import { requireAdmin } from "@/lib/api/auth"
import { attachPrimaryImages } from "@/lib/api/primary-images"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { REVIEW_STATUSES } from "@/lib/validation/review"

const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "rating-desc": { rating: -1, createdAt: -1 },
  "rating-asc": { rating: 1, createdAt: -1 },
}

type Condition = Record<string, unknown>

/**
 * GET /api/admin/reviews — admin only. Paginated moderation queue of every
 * non-deleted review (pending, published and hidden), each with its real
 * reviewer (name + email — never the password hash) and product (name, slug,
 * primary image), plus queue-wide summary counts and the list of products that
 * have reviews (for the product filter).
 *
 * Filters: `status`, `productId`, `rating` (1-5), `search` (customer name or
 * email, product name, or review text), `sort`.
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const conditions: Condition[] = [{ deletedAt: null }]

    const status = searchParams.get("status")
    if (status) {
      if (!(REVIEW_STATUSES as readonly string[]).includes(status)) return badRequest("Invalid status filter.")
      conditions.push({ status })
    }

    const productId = searchParams.get("productId")
    if (productId) {
      if (!isValidObjectId(productId)) return badRequest("Invalid productId.")
      conditions.push({ productId })
    }

    const rating = searchParams.get("rating")
    if (rating) {
      if (!/^[1-5]$/.test(rating)) return badRequest("Invalid rating filter.")
      conditions.push({ rating: Number(rating) })
    }

    const sort = SORT_OPTIONS[searchParams.get("sort") ?? "newest"]
    if (!sort) return badRequest("Invalid sort.")

    const search = searchParams.get("search")?.trim()
    if (search) {
      const tokens = search.split(/\s+/).filter(Boolean)
      const [customers, products] = await Promise.all([
        User.find({
          $or: [
            { email: { $regex: escapeRegex(search), $options: "i" } },
            // Every word must match the first or last name, so "sarah miller" finds Sarah Miller.
            {
              $and: tokens.map((token) => ({
                $or: [
                  { firstName: { $regex: escapeRegex(token), $options: "i" } },
                  { lastName: { $regex: escapeRegex(token), $options: "i" } },
                ],
              })),
            },
          ],
        })
          .select("_id")
          .lean(),
        Product.find({ name: { $regex: escapeRegex(search), $options: "i" } }).select("_id").lean(),
      ])

      conditions.push({
        $or: [
          { comment: { $regex: escapeRegex(search), $options: "i" } },
          { userId: { $in: customers.map((customer) => customer._id) } },
          { productId: { $in: products.map((product) => product._id) } },
        ],
      })
    }

    const filter = { $and: conditions }
    const live = { deletedAt: null }

    const [reviews, total, statusStats, productIdsWithReviews] = await Promise.all([
      Review.find(filter).sort({ ...sort, _id: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
      Review.aggregate<{ _id: string; count: number; ratingSum: number }>([
        { $match: live },
        { $group: { _id: "$status", count: { $sum: 1 }, ratingSum: { $sum: "$rating" } } },
      ]),
      Review.distinct("productId", live),
    ])

    const userIds = [...new Set(reviews.map((review) => review.userId.toString()))]
    const productIds = [...new Set(reviews.map((review) => review.productId.toString()))]

    const [users, products, productOptions] = await Promise.all([
      // Allow-list select: the password hash is never read.
      userIds.length > 0 ? User.find({ _id: { $in: userIds } }).select("firstName lastName email").lean() : [],
      // Historical reviews keep resolving their product even if it was later deleted/deactivated.
      productIds.length > 0 ? Product.find({ _id: { $in: productIds } }).select("name slug").lean() : [],
      productIdsWithReviews.length > 0
        ? Product.find({ _id: { $in: productIdsWithReviews } }).select("name slug").sort({ name: 1 }).lean()
        : [],
    ])
    const productsWithImages = await attachPrimaryImages(products)

    const userById = new Map(users.map((user) => [user._id.toString(), user]))
    const productById = new Map(productsWithImages.map((product) => [product._id.toString(), product]))

    const countFor = (name: string) => statusStats.find((entry) => entry._id === name)?.count ?? 0
    const totalReviews = statusStats.reduce((sum, entry) => sum + entry.count, 0)
    const ratingSum = statusStats.reduce((sum, entry) => sum + entry.ratingSum, 0)

    return ok({
      items: reviews.map((review) => {
        const customer = userById.get(review.userId.toString())
        const product = productById.get(review.productId.toString())
        return {
          _id: review._id.toString(),
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          isVerifiedPurchase: review.isVerifiedPurchase,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          customer: customer
            ? { id: customer._id.toString(), name: `${customer.firstName} ${customer.lastName}`.trim(), email: customer.email }
            : null,
          product: product
            ? { id: product._id.toString(), name: product.name, slug: product.slug, image: product.primaryImage?.imageUrl ?? null }
            : null,
        }
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        total: totalReviews,
        published: countFor("published"),
        pending: countFor("pending"),
        hidden: countFor("hidden"),
        averageRating: totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 10) / 10 : 0,
      },
      productOptions: productOptions.map((product) => ({ _id: product._id.toString(), name: product.name, slug: product.slug })),
    })
  } catch (error) {
    return serverError("GET /api/admin/reviews failed:", error)
  }
}
