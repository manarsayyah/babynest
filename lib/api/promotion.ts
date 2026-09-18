import type mongoose from "mongoose"
import Promotion from "@/models/Promotion"

/** A promotion validation failure with an HTTP status attached, so the route handler can map it directly. */
export class PromotionError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "PromotionError"
    this.status = status
  }
}

/**
 * Loads a promotion by code and validates it against `subtotal`, throwing a
 * `PromotionError` for every edge case (not found, deleted, inactive, not
 * started, expired). Returns the promotion plus the server-calculated
 * discount — the caller never supplies or trusts a discount amount.
 *
 * - percentage discounts are capped at 100% of the subtotal
 * - fixed discounts are capped at the subtotal itself (grand total can never go negative)
 */
export async function resolvePromotion(
  code: string,
  subtotal: number,
  session: mongoose.ClientSession | null = null
) {
  const normalizedCode = code.trim().toUpperCase()

  const promotion = await Promotion.findOne({ code: normalizedCode, deletedAt: null }).session(session)
  if (!promotion) throw new PromotionError(404, "This promotion code does not exist.")

  if (!promotion.isActive) throw new PromotionError(400, "This promotion is not currently active.")

  const now = new Date()
  if (now < promotion.startDate) throw new PromotionError(400, "This promotion has not started yet.")
  if (now > promotion.endDate) throw new PromotionError(400, "This promotion has expired.")

  let discountApplied: number
  if (promotion.discountType === "percentage") {
    const percent = Math.min(Math.max(promotion.discountValue, 0), 100)
    discountApplied = subtotal * (percent / 100)
  } else {
    discountApplied = Math.min(Math.max(promotion.discountValue, 0), subtotal)
  }
  discountApplied = Math.max(0, Math.round(discountApplied * 100) / 100)

  return { promotion, discountApplied }
}
