import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Review from "@/models/Review"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, ok, serverError } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { parsePagination } from "@/lib/api/pagination"
import { REVIEW_STATUSES } from "@/lib/validation/review"

/** GET /api/admin/reviews — admin only. Lists all reviews, optionally filtered by status/productId. */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const filter: Record<string, unknown> = { deletedAt: null }

    const status = searchParams.get("status")
    if (status) {
      if (!(REVIEW_STATUSES as readonly string[]).includes(status)) {
        return badRequest("Invalid status filter.")
      }
      filter.status = status
    }

    const productId = searchParams.get("productId")
    if (productId) {
      if (!isValidObjectId(productId)) return badRequest("Invalid productId.")
      filter.productId = productId
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ])

    return ok({ items: reviews, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    return serverError("GET /api/admin/reviews failed:", error)
  }
}
