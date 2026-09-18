import { Repeat2, UserCheck, UserPlus, Users } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import { isNewCustomer, isReturningCustomer, type AdminCustomer } from "@/lib/mock/admin-customers"

export type CustomersSummaryCardsProps = {
  customers: AdminCustomer[]
}

/** Total / Active / New / Returning — compact row above the customers table. */
function CustomersSummaryCards({ customers }: CustomersSummaryCardsProps) {
  const total = customers.length
  const active = customers.filter((c) => c.status === "active").length
  const newCustomers = customers.filter((c) => isNewCustomer(c)).length
  const returning = customers.filter((c) => isReturningCustomer(c)).length

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={Users}
        label="Total Customers"
        value={total.toLocaleString("en-US")}
        note="All accounts"
        tone="primary"
      />
      <CompactStatCard
        icon={UserCheck}
        label="Active Customers"
        value={active.toLocaleString("en-US")}
        note="Currently shopping"
        tone="success"
      />
      <CompactStatCard
        icon={UserPlus}
        label="New Customers"
        value={newCustomers.toLocaleString("en-US")}
        note="Joined in last 30 days"
        tone="ai"
      />
      <CompactStatCard
        icon={Repeat2}
        label="Returning Customers"
        value={returning.toLocaleString("en-US")}
        note="Placed 2+ orders"
        tone="warning"
      />
    </div>
  )
}

export { CustomersSummaryCards }
