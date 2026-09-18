/**
 * Admin Products status rules — a pure module shared by the admin list API
 * (which filters/counts with them) and the admin UI (which labels with them),
 * so both always agree. Status is *derived* from the real Product fields
 * (`isActive`, `stock`); there is no separate status column.
 */
export type AdminProductStatus = "active" | "inactive" | "out-of-stock"

/** A product with this many units or fewer (but more than 0) counts as "low stock". */
export const LOW_STOCK_THRESHOLD = 10

/** An unpublished (`isActive: false`) product is "inactive" regardless of stock; a published one with no stock is "out-of-stock". */
export function deriveProductStatus(product: { isActive: boolean; stock: number }): AdminProductStatus {
  if (!product.isActive) return "inactive"
  if (product.stock <= 0) return "out-of-stock"
  return "active"
}
