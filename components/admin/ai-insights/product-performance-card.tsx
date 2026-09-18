import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatPrice } from "@/lib/format"
import { shopCatalog } from "@/lib/mock/shop-catalog"
import { topProductsPreview } from "@/lib/mock/admin-dashboard"
import { getDecliningProducts, getTopCategoriesByRevenue } from "@/lib/mock/admin-ai-insights"

/** "Product Performance" — top sellers, softening listings, and best-selling categories, all from shared mock data. */
function ProductPerformanceCard() {
  const topPerforming = topProductsPreview
    .map((entry) => {
      const product = shopCatalog.find((p) => p.slug === entry.slug)
      return product ? { product, ...entry } : null
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .slice(0, 3)

  const declining = getDecliningProducts(3)
  const topCategories = getTopCategoriesByRevenue(4)
  const maxCategoryRevenue = topCategories[0]?.revenue ?? 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Product Performance</CardTitle>
        <p className="text-caption text-muted-foreground">Top sellers, softening listings, and category mix</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {topPerforming.length === 0 && declining.length === 0 ? (
          <EmptyState title="No insights available yet" description="Once your store has enough sales data, product performance will appear here." />
        ) : (
          <>
            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Top Performing</h4>
              <div className="flex flex-col divide-y divide-border">
                {topPerforming.map(({ product, soldCount, revenue }) => (
                  <div key={product.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                    />
                    <span className="min-w-0 flex-1 truncate text-small text-foreground">{product.name}</span>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="text-small font-semibold text-foreground">{formatPrice(revenue)}</span>
                      <span className="text-caption text-muted-foreground">{soldCount} sold</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Needs Attention</h4>
              <div className="flex flex-col divide-y divide-border">
                {declining.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                    />
                    <span className="min-w-0 flex-1 truncate text-small text-foreground">{product.name}</span>
                    <Badge variant="warning">{product.rating.toFixed(1)}★</Badge>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-caption text-muted-foreground">
                Based on recent rating trends — most-viewed tracking isn&apos;t connected yet.
              </p>
            </div>

            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Best-Selling Categories</h4>
              <div className="flex flex-col gap-2.5">
                {topCategories.map((category) => (
                  <div key={category.slug} className="flex flex-col gap-1">
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
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { ProductPerformanceCard }
