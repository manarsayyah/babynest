import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatPrice } from "@/lib/format"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { AdminInsights } from "@/lib/api-client/admin-insights"

export type ProductPerformanceCardProps = {
  products: AdminInsights["products"] | null
}

/** "Product Performance" — top sellers, lowest-rated listings, and best-selling categories, all from real orders and reviews. */
function ProductPerformanceCard({ products }: ProductPerformanceCardProps) {
  const topPerforming = products?.topPerforming ?? []
  const needsAttention = products?.needsAttention ?? []
  const topCategories = products?.topCategories ?? []
  const maxCategoryRevenue = topCategories[0]?.revenue || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Product Performance</CardTitle>
        <p className="text-caption text-muted-foreground">Top sellers, lowest-rated listings, and category mix</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {!products || (topPerforming.length === 0 && needsAttention.length === 0 && topCategories.length === 0) ? (
          <EmptyState
            title="No insights available yet"
            description="Once your store has sales and reviews, product performance will appear here."
          />
        ) : (
          <>
            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Top Performing</h4>
              {topPerforming.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {topPerforming.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image ?? PLACEHOLDER_PRODUCT_IMAGE}
                        alt={product.name}
                        className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                      />
                      <span className="min-w-0 flex-1 truncate text-small text-foreground">{product.name}</span>
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="text-small font-semibold text-foreground">{formatPrice(product.revenue)}</span>
                        <span className="text-caption text-muted-foreground">{product.soldCount} sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-caption text-muted-foreground">No sales yet — best sellers will appear after the first orders.</p>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Needs Attention</h4>
              {needsAttention.length > 0 ? (
                <>
                  <div className="flex flex-col divide-y divide-border">
                    {needsAttention.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image ?? PLACEHOLDER_PRODUCT_IMAGE}
                          alt={product.name}
                          className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                        />
                        <span className="min-w-0 flex-1 truncate text-small text-foreground">{product.name}</span>
                        <Badge variant="warning">{product.rating.toFixed(1)}★</Badge>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-caption text-muted-foreground">
                    The lowest-rated active products, by customer review rating.
                  </p>
                </>
              ) : (
                <p className="text-caption text-muted-foreground">No rated products yet.</p>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Best-Selling Categories</h4>
              {topCategories.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {topCategories.map((category) => (
                    <div key={category.id} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-small">
                        <span className="text-foreground">{category.name}</span>
                        <span className="font-medium text-foreground">{formatPrice(category.revenue)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(6, (category.revenue / maxCategoryRevenue) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-caption text-muted-foreground">No category sales yet.</p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { ProductPerformanceCard }
