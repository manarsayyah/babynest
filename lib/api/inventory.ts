import ProductVariant from "@/models/ProductVariant"
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-product-status"

/**
 * The single inventory definition shared by the Admin Dashboard, Reports and
 * AI Insights. Source of truth is the variant stock (`ProductVariant.stockQty`,
 * the field checkout decrements), taken from each product's non-deleted variants:
 *
 * - out of stock: the product has variants and every one of them is at 0
 * - low stock:    not out of stock, but at least one variant is at or below
 *                 LOW_STOCK_THRESHOLD (a variant that needs restocking)
 * - a product with no variants falls back to its own `stock` (the same rule
 *   the product detail page uses)
 *
 * A product is classified once, however many variants it has.
 */
export type InventoryStatus = "ok" | "low" | "out"

export type VariantStockSummary = { count: number; totalQty: number; minQty: number; valueDelta: number }

/** One entry per product that has at least one non-deleted variant. Products without variants are absent. */
export async function getVariantStockSummaries(productIds?: unknown[]): Promise<Map<string, VariantStockSummary>> {
  const rows = await ProductVariant.aggregate<{ _id: unknown } & VariantStockSummary>([
    { $match: { deletedAt: null, ...(productIds ? { productId: { $in: productIds } } : {}) } },
    {
      $group: {
        _id: "$productId",
        count: { $sum: 1 },
        totalQty: { $sum: "$stockQty" },
        minQty: { $min: "$stockQty" },
        valueDelta: { $sum: { $multiply: ["$stockQty", "$priceDelta"] } },
      },
    },
  ])
  return new Map(rows.map((row) => [String(row._id), { count: row.count, totalQty: row.totalQty, minQty: row.minQty, valueDelta: row.valueDelta }]))
}

export function classifyInventory(productStock: number, summary: VariantStockSummary | undefined): InventoryStatus {
  if (!summary) {
    if (productStock <= 0) return "out"
    return productStock <= LOW_STOCK_THRESHOLD ? "low" : "ok"
  }
  if (summary.totalQty <= 0) return "out"
  return summary.minQty <= LOW_STOCK_THRESHOLD ? "low" : "ok"
}
