import type { NextRequest } from "next/server"
import connectToDatabase from "@/lib/db"
import { requireUser } from "@/lib/api/auth"
import { resolvePromotion, PromotionError } from "@/lib/api/promotion"
import { computeActiveCartSubtotal } from "@/lib/api/cart-pricing"
import { badRequest, notFound, ok, serverError, validationFailed } from "@/lib/api/response"
import { validatePromotionCodeSchema } from "@/lib/validation/promotion"

/**
 * POST /api/promotions/validate — the customer sends only a code; the
 * subtotal it's checked against comes from their own server-side active
 * cart, never from the client, so the previewed discount can't be gamed.
 */
export async function POST(request: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return badRequest("Invalid request body.")
    }

    const parsed = validatePromotionCodeSchema.safeParse(body)
    if (!parsed.success) return validationFailed(parsed.error.flatten().fieldErrors)

    await connectToDatabase()

    const subtotal = await computeActiveCartSubtotal(session.user.id)
    if (subtotal === null) return badRequest("Your cart is empty.")

    const { promotion, discountApplied } = await resolvePromotion(parsed.data.code, subtotal)

    return ok({
      code: promotion.code,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      subtotal,
      discountApplied,
      total: Math.max(0, Math.round((subtotal - discountApplied) * 100) / 100),
    })
  } catch (error) {
    if (error instanceof PromotionError) {
      return error.status === 404 ? notFound(error.message) : badRequest(error.message)
    }
    return serverError("POST /api/promotions/validate failed:", error)
  }
}
