import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatPrice } from "@/lib/format"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { AdminReport } from "@/lib/api-client/admin-reports"

export type ProductPerformanceReportCardProps = {
  topProducts: AdminReport["products"]["topSelling"]
  lowestProducts: AdminReport["products"]["lowestRated"]
}

/** "Product Performance" — top sellers in the period (revenue + units sold) and the lowest-rated active listings. */
function ProductPerformanceReportCard({ topProducts, lowestProducts }: ProductPerformanceReportCardProps) {
  const hasData = topProducts.length > 0 || lowestProducts.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Product Performance</CardTitle>
        <p className="text-caption text-muted-foreground">Top sellers in this period and the lowest-rated listings</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {hasData ? (
          <>
            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Top Selling Products</h4>
              {topProducts.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {topProducts.map((product) => (
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
                        <span className="text-caption text-muted-foreground">{product.unitsSold} sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-muted-foreground">No sales in this period.</p>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Lowest Rated Products</h4>
              {lowestProducts.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {lowestProducts.map((product) => (
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
              ) : (
                <p className="text-small text-muted-foreground">No rated listings yet.</p>
              )}
            </div>
          </>
        ) : (
          <EmptyState
            title="No report data available"
            description="Once your store has enough data, reports will appear here."
          />
        )}
      </CardContent>
    </Card>
  )
}

export { ProductPerformanceReportCard }
