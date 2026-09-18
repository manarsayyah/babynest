import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import Promotion from "@/models/Promotion"
import { requireAdmin } from "@/lib/api/auth"
import { badRequest, conflict, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { isValidObjectId } from "@/lib/api/object-id"
import { updatePromotionSchema } from "@/lib/validation/promotion"

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/admin/promotions/[id] — admin only. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const promotion = await Promotion.findOne({ _id: id, deletedAt: null }).lean()
    if (!promotion) return notFound()

    return ok(promotion)
  } catch (error) {
    return serverError("GET /api/admin/promotions/[id] failed:", error)
  }
}

/** PATCH /api/admin/promotions/[id] — admin only. */
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

    const parsed = updatePromotionSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const promotion = await Promotion.findOne({ _id: id, deletedAt: null })
    if (!promotion) return notFound()

    const { code, discountType, discountValue, startDate, endDate } = parsed.data

    if (code && code !== promotion.code) {
      const codeTaken = await Promotion.findOne({ code, _id: { $ne: id }, deletedAt: null }).select("_id").lean()
      if (codeTaken) return conflict("A promotion with this code already exists.")
    }

    // Cross-field checks must account for fields not present in this
    // request but already on the document (e.g. changing only
    // discountValue on an existing percentage promotion).
    const effectiveType = discountType ?? promotion.discountType
    const effectiveValue = discountValue ?? promotion.discountValue
    if (effectiveType === "percentage" && effectiveValue > 100) {
      return badRequest("A percentage discount cannot exceed 100.")
    }

    const effectiveStart = startDate ?? promotion.startDate
    const effectiveEnd = endDate ?? promotion.endDate
    if (effectiveEnd <= effectiveStart) {
      return badRequest("endDate must be after startDate.")
    }

    Object.assign(promotion, parsed.data)
    await promotion.save()

    return ok(promotion.toObject())
  } catch (error) {
    return serverError("PATCH /api/admin/promotions/[id] failed:", error)
  }
}

/** DELETE /api/admin/promotions/[id] — admin only, soft delete via deletedAt (never a physical delete). */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAdmin()
    if (authError) return authError

    const { id } = await params
    if (!isValidObjectId(id)) return notFound()

    await connectToDatabase()

    const promotion = await Promotion.findOne({ _id: id, deletedAt: null })
    if (!promotion) return notFound()

    promotion.deletedAt = new Date()
    await promotion.save()

    return ok({ id })
  } catch (error) {
    return serverError("DELETE /api/admin/promotions/[id] failed:", error)
  }
}
