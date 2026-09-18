import { AlertTriangle, PackageX, TrendingUp } from "lucide-react"
import type { ElementType } from "react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { LOW_STOCK_THRESHOLD } from "@/lib/mock/admin-products"
import { getInventoryRiskCounts, getVelocityRestockCandidates } from "@/lib/mock/admin-ai-insights"

const priorityBadgeVariant = {
  high: "warning",
  medium: "ai",
  low: "outline",
} as const

const priorityLabel = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
} as const

type InventoryRow = {
  id: string
  icon: ElementType
  title: string
  description: string
  priority: keyof typeof priorityLabel
}

/** "Inventory Insights" — restock/out-of-stock signals derived from the real admin product list. */
function InventoryInsightsCard() {
  const { outOfStock, lowStock } = getInventoryRiskCounts()
  const velocityCandidates = getVelocityRestockCandidates(2)

  const rows: InventoryRow[] = []

  if (outOfStock.length > 0) {
    rows.push({
      id: "out-of-stock",
      icon: PackageX,
      title: `${outOfStock.length} ${outOfStock.length === 1 ? "product is" : "products are"} out of stock`,
      description: outOfStock.map((p) => p.name).slice(0, 3).join(", ") + (outOfStock.length > 3 ? ", and more." : "."),
      priority: "high",
    })
  }

  if (lowStock.length > 0) {
    rows.push({
      id: "low-stock",
      icon: AlertTriangle,
      title: `${lowStock.length} ${lowStock.length === 1 ? "product" : "products"} may run out of stock soon`,
      description: `Below ${LOW_STOCK_THRESHOLD} units: ${lowStock.map((p) => p.name).slice(0, 3).join(", ")}${lowStock.length > 3 ? ", and more." : "."}`,
      priority: "medium",
    })
  }

  velocityCandidates.forEach((product) => {
    rows.push({
      id: `velocity-${product.id}`,
      icon: TrendingUp,
      title: `${product.name} has strong sales velocity`,
      description: `${product.reviewCount} reviews at ${product.rating.toFixed(1)}★ with only ${product.stock} units left — consider restocking soon.`,
      priority: "medium",
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Inventory Insights</CardTitle>
        <p className="text-caption text-muted-foreground">Stock risks and restock recommendations</p>
      </CardHeader>
      <CardContent>
        {rows.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {rows.map((row) => {
              const Icon = row.icon
              return (
                <div key={row.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      row.priority === "high" ? "bg-warning/15 text-warning-foreground" : "bg-ai-muted text-ai"
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-small font-medium text-foreground">{row.title}</p>
                      <Badge variant={priorityBadgeVariant[row.priority]}>{priorityLabel[row.priority]}</Badge>
                    </div>
                    <p className="mt-0.5 text-caption text-muted-foreground">{row.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState title="No insights available yet" description="Once your store has enough inventory data, stock recommendations will appear here." />
        )}
      </CardContent>
    </Card>
  )
}

export { InventoryInsightsCard }
