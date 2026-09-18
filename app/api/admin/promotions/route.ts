import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Promotion from "@/models/Promotion"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, created, ok, serverError, validationFailed } from "@/lib/api/response"
import { escapeRegex } from "@/lib/api/regex"
import { parsePagination } from "@/lib/api/pagination"
import { createPromotionSchema } from "@/lib/validation/promotion"

/** GET /api/admin/promotions — admin only. */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    await connectToDatabase()

    const searchParams = request.nextUrl.searchParams
    const { page, limit, skip } = parsePagination(searchParams)

    const filter: Record<string, unknown> = { deletedAt: null }

    const isActiveParam = searchParams.get("isActive")
    if (isActiveParam === "true") filter.isActive = true
    if (isActiveParam === "false") filter.isActive = false

    const code = searchParams.get("code")
    if (code) filter.code = { $regex: escapeRegex(code.toUpperCase()) }

    const [promotions, total] = await Promise.all([
      Promotion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Promotion.countDocuments(filter),
    ])

    return ok({ items: promotions, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) })
  } catch (error) {
    return serverError("GET /api/admin/promotions failed:", error)
  }
}

/** POST /api/admin/promotions — admin only. */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = createPromotionSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    // The unique index on `code` doesn't distinguish soft-deleted rows, so
    // a previously removed code is reactivated in place instead of
    // colliding with a fresh insert.
    const existing = await Promotion.findOne({ code: parsed.data.code })
    if (existing) {
      if (existing.deletedAt === null) return conflict("A promotion with this code already exists.")
      Object.assign(existing, parsed.data, { deletedAt: null })
      await existing.save()
      return created(existing.toObject())
    }

    const promotion = await Promotion.create(parsed.data)
    return created(promotion)
  } catch (error) {
    return serverError("POST /api/admin/promotions failed:", error)
  }
}
