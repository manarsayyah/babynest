import { FolderOpen, FolderX, LayoutGrid, PackageCheck } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminCategory } from "@/lib/mock/admin-categories"

export type CategoriesSummaryCardsProps = {
  categories: AdminCategory[]
}

/** Total / Active / Products Assigned / Empty — compact row above the categories grid. */
function CategoriesSummaryCards({ categories }: CategoriesSummaryCardsProps) {
  const total = categories.length
  const active = categories.filter((c) => c.status === "active").length
  const productsAssigned = categories.reduce((sum, c) => sum + c.productCount, 0)
  const empty = categories.filter((c) => c.productCount === 0).length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={LayoutGrid}
        label="Total Categories"
        value={total.toLocaleString("en-US")}
        note="Across the catalog"
        tone="primary"
      />
      <CompactStatCard
        icon={FolderOpen}
        label="Active Categories"
        value={active.toLocaleString("en-US")}
        note="Visible in the shop"
        tone="success"
      />
      <CompactStatCard
        icon={PackageCheck}
        label="Products Assigned"
        value={productsAssigned.toLocaleString("en-US")}
        note="Across all categories"
        tone="ai"
      />
      <CompactStatCard
        icon={FolderX}
        label="Empty Categories"
        value={empty.toLocaleString("en-US")}
        note="No products yet"
        tone="warning"
      />
    </div>
  )
}

export { CategoriesSummaryCards }
