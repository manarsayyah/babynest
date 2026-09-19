import { AlertTriangle, PackageX, TrendingUp } from "lucide-react"
import type { ElementType } from "react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import type { AdminInsights } from "@/lib/api-client/admin-insights"

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

export type InventoryInsightsCardProps = {
  inventory: AdminInsights["inventory"] | null
}

/** "Inventory Insights" — restock/out-of-stock signals calculated from real product and variant stock and recent sales. */
function InventoryInsightsCard({ inventory }: InventoryInsightsCardProps) {
  const rows: InventoryRow[] = []

  if (inventory) {
    const { outOfStock, lowStock, restockCandidates, threshold } = inventory

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
        description: `${threshold} units or fewer: ${lowStock.map((p) => p.name).slice(0, 3).join(", ")}${lowStock.length > 3 ? ", and more." : "."}`,
        priority: "medium",
      })
    }

    restockCandidates.forEach((product) => {
      rows.push({
        id: `restock-${product.id}`,
        icon: TrendingUp,
        title: `${product.name} is selling fast`,
        description: `${product.soldLast30Days} ${product.soldLast30Days === 1 ? "unit" : "units"} sold in the last 30 days with only ${product.stock} left — consider restocking soon.`,
        priority: "medium",
      })
    })
  }

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
          <EmptyState
            title={inventory ? "No stock risks right now" : "No insights available yet"}
            description={
              inventory
                ? `Every active product has more than ${inventory.threshold} units in stock.`
                : "Once your store has enough inventory data, stock recommendations will appear here."
            }
          />
        )}
      </CardContent>
    </Card>
  )
}

export { InventoryInsightsCard }
