/** Plain (non-"use client") utility so Server Components can format prices too. */
export function formatPrice(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}
