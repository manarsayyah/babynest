import { CheckCircle2, Package, PackageX, TriangleAlert } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminProductSummary } from "@/lib/api-client/admin-products"

export type ProductsSummaryCardsProps = {
  /** Catalog-wide counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminProductSummary | null
}

/** Total / Active / Out of Stock / Low Stock — compact one-row summary above the products table. */
function ProductsSummaryCards({ summary }: ProductsSummaryCardsProps) {
  const total = summary?.total ?? 0
  const activeShare = summary && total > 0 ? Math.round((summary.active / total) * 100) : 0
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={Package}
        label="Total Products"
        value={format(summary?.total)}
        note="Across all categories"
        noteTone="positive"
        tone="primary"
      />
      <CompactStatCard
        icon={CheckCircle2}
        label="Active Products"
        value={format(summary?.active)}
        note={`${activeShare}% of catalog`}
        noteTone="positive"
        tone="success"
      />
      <CompactStatCard
        icon={PackageX}
        label="Out of Stock"
        value={format(summary?.outOfStock)}
        note="Needs restocking"
        noteTone="attention"
        tone="warning"
      />
      <CompactStatCard
        icon={TriangleAlert}
        label="Low Stock"
        value={format(summary?.lowStock)}
        note="10 units or fewer"
        noteTone="attention"
        tone="warning"
      />
    </div>
  )
}

export { ProductsSummaryCards }
