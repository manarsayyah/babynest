import { CheckCircle2, ClipboardList, Hourglass, RefreshCw, XCircle } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminOrderSummary } from "@/lib/api-client/admin-orders"

export type OrdersSummaryCardsProps = {
  /** All-time counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminOrderSummary | null
}

/** Total / Pending / Processing / Completed / Cancelled — compact row above the orders table. */
function OrdersSummaryCards({ summary }: OrdersSummaryCardsProps) {
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <CompactStatCard
        icon={ClipboardList}
        label="Total Orders"
        value={format(summary?.total)}
        note="All time"
        tone="primary"
      />
      <CompactStatCard
        icon={Hourglass}
        label="Pending"
        value={format(summary?.pending)}
        note="Awaiting confirmation"
        tone="warning"
      />
      <CompactStatCard
        icon={RefreshCw}
        label="Processing"
        value={format(summary?.processing)}
        note="Being prepared"
        tone="ai"
      />
      <CompactStatCard
        icon={CheckCircle2}
        label="Completed"
        value={format(summary?.delivered)}
        note="Delivered to customer"
        tone="success"
      />
      <CompactStatCard
        icon={XCircle}
        label="Cancelled"
        value={format(summary?.cancelled)}
        note="Refunded or void"
        tone="destructive"
      />
    </div>
  )
}

export { OrdersSummaryCards }
