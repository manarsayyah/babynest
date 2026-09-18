import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { formatPrice } from "@/lib/format"
import type { AdminProduct } from "@/lib/mock/admin-products"
import type { ReportProductPerformance } from "@/lib/mock/admin-reports"

export type ProductPerformanceReportCardProps = {
  topProducts: ReportProductPerformance[]
  lowestProducts: AdminProduct[]
}

/** "Product Performance" — top sellers (revenue + units sold) and the lowest-rated active listings. */
function ProductPerformanceReportCard({ topProducts, lowestProducts }: ProductPerformanceReportCardProps) {
  const hasData = topProducts.length > 0 || lowestProducts.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Product Performance</CardTitle>
        <p className="text-caption text-muted-foreground">Top sellers and the lowest-performing listings</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {hasData ? (
          <>
            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Top Selling Products</h4>
              {topProducts.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {topProducts.map(({ product, revenue, unitsSold }) => (
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
                        <span className="text-caption text-muted-foreground">{unitsSold} sold</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-small text-muted-foreground">No top sellers for this category yet.</p>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-small font-semibold text-foreground">Lowest Performing Products</h4>
              {lowestProducts.length > 0 ? (
                <div className="flex flex-col divide-y divide-border">
                  {lowestProducts.map((product) => (
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
              ) : (
                <p className="text-small text-muted-foreground">No listings for this category yet.</p>
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
