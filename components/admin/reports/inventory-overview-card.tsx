import { AlertTriangle, PackageX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/lib/format"

export type InventoryOverviewCardProps = {
  total: number
  outOfStock: { id: string; name: string }[]
  lowStock: { id: string; name: string }[]
  inventoryValue: number
}

/** "Inventory Overview" — totals plus a subtle read on stock risk, from real product and variant stock. */
function InventoryOverviewCard({ total, outOfStock, lowStock, inventoryValue }: InventoryOverviewCardProps) {
  const rows = [
    { label: "Total Products", value: total.toLocaleString("en-US") },
    { label: "Low Stock Products", value: lowStock.length.toLocaleString("en-US") },
    { label: "Out of Stock Products", value: outOfStock.length.toLocaleString("en-US") },
    { label: "Inventory Value", value: formatPrice(inventoryValue) },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Inventory Overview</CardTitle>
        <p className="text-caption text-muted-foreground">Stock levels and estimated inventory value</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label} className="rounded-xl bg-muted/50 p-3">
              <p className="text-h3 text-foreground">{row.value}</p>
              <p className="mt-0.5 text-caption font-medium text-muted-foreground">{row.label}</p>
            </div>
          ))}
        </div>

        {outOfStock.length > 0 || lowStock.length > 0 ? (
          <div className="flex flex-col gap-2">
            {outOfStock.length > 0 ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-warning/10 p-2.5">
                <PackageX className="mt-0.5 size-3.5 shrink-0 text-warning-foreground" />
                <p className="text-caption text-foreground">
                  {outOfStock.map((p) => p.name).slice(0, 3).join(", ")}
                  {outOfStock.length > 3 ? ", and more" : ""} — currently out of stock.
                </p>
              </div>
            ) : null}
            {lowStock.length > 0 ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-ai-muted/50 p-2.5">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-ai" />
                <p className="text-caption text-foreground">
                  {lowStock.map((p) => p.name).slice(0, 3).join(", ")}
                  {lowStock.length > 3 ? ", and more" : ""} — running low, consider restocking.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export { InventoryOverviewCard }
