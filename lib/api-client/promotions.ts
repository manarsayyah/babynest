import { apiFetch } from "@/lib/api-client/fetcher"
import { formatPrice } from "@/lib/format"

/** POST /api/promotions/validate response — every figure is server-calculated from the caller's own cart. */
export type AppliedPromo = {
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  /** The cart subtotal the server validated against. */
  subtotal: number
  discountApplied: number
  total: number
}

/** Sends only the code; the subtotal is read from the caller's server-side cart. */
export async function validatePromotion(code: string): Promise<AppliedPromo> {
  return apiFetch<AppliedPromo>("/api/promotions/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  })
}

/** "15% off" / "$5.00 off" — describes the promotion exactly as the server reported it. */
export function describePromo(promo: Pick<AppliedPromo, "discountType" | "discountValue">): string {
  return promo.discountType === "percentage" ? `${promo.discountValue}% off` : `${formatPrice(promo.discountValue)} off`
}
