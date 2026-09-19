import { FolderOpen, FolderX, LayoutGrid, PackageCheck } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminCategorySummary } from "@/lib/api-client/admin-categories"

export type CategoriesSummaryCardsProps = {
  /** Catalog-wide counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminCategorySummary | null
}

/** Total / Active / Products Assigned / Empty — compact row above the categories grid. */
function CategoriesSummaryCards({ summary }: CategoriesSummaryCardsProps) {
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={LayoutGrid}
        label="Total Categories"
        value={format(summary?.total)}
        note="Across the catalog"
        tone="primary"
      />
      <CompactStatCard
        icon={FolderOpen}
        label="Active Categories"
        value={format(summary?.active)}
        note="Visible in the shop"
        tone="success"
      />
      <CompactStatCard
        icon={PackageCheck}
        label="Products Assigned"
        value={format(summary?.productsAssigned)}
        note="Across all categories"
        tone="ai"
      />
      <CompactStatCard
        icon={FolderX}
        label="Empty Categories"
        value={format(summary?.empty)}
        note="No products yet"
        tone="warning"
      />
    </div>
  )
}

export { CategoriesSummaryCards }
