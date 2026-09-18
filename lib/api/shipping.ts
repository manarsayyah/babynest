// Mirrors the storefront's existing flat-rate rule (the old cart page:
// FREE_SHIPPING_THRESHOLD / FLAT_SHIPPING_FEE) so checkout charges the same
// shipping the cart page has always advertised.
export const FREE_SHIPPING_THRESHOLD = 75
const FLAT_SHIPPING_FEE = 6.99

/** Default shipping rule: free at/above the threshold, a flat fee otherwise. */
export function calculateShippingCost(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE
}
