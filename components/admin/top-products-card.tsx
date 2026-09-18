import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { AdminDashboardData } from "@/lib/api-client/admin-dashboard"

/** "Top Products" — best sellers by units sold across non-cancelled orders, from real order data. */
function TopProductsCard({ products }: { products: AdminDashboardData["topProducts"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Top Products</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {products.length === 0 ? <p className="text-small text-muted-foreground">No sales yet.</p> : null}
        {products.map((product) => (
          <Link
            key={product.id}
            href="/admin/products"
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80"
          >
            <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image ?? PLACEHOLDER_PRODUCT_IMAGE} alt={product.name} className="size-full object-cover" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-small font-medium text-foreground">{product.name}</span>
              <span className="text-caption text-muted-foreground">{product.category ?? "Uncategorized"}</span>
            </div>
            <div className="flex shrink-0 flex-col items-end">
              <span className="text-small font-semibold text-foreground">{formatPrice(product.revenue)}</span>
              <span className="text-caption text-muted-foreground">{product.soldCount} sold</span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export { TopProductsCard }
