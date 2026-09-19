import { Repeat2, UserCheck, UserPlus, Users } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminCustomerSummary } from "@/lib/api-client/admin-customers"

export type CustomersSummaryCardsProps = {
  /** Account-wide counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminCustomerSummary | null
}

/** Total / Active / New / Returning — compact row above the customers table. */
function CustomersSummaryCards({ summary }: CustomersSummaryCardsProps) {
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={Users}
        label="Total Customers"
        value={format(summary?.total)}
        note="All accounts"
        tone="primary"
      />
      <CompactStatCard
        icon={UserCheck}
        label="Active Customers"
        value={format(summary?.active)}
        note="Currently shopping"
        tone="success"
      />
      <CompactStatCard
        icon={UserPlus}
        label="New Customers"
        value={format(summary?.new)}
        note="Joined in last 30 days"
        tone="ai"
      />
      <CompactStatCard
        icon={Repeat2}
        label="Returning Customers"
        value={format(summary?.returning)}
        note="Placed 2+ orders"
        tone="warning"
      />
    </div>
  )
}

export { CustomersSummaryCards }
