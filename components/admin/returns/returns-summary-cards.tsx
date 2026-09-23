import { CheckCircle2, ClipboardList, Hourglass, ThumbsUp, XCircle } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminReturnSummary } from "@/lib/api-client/admin-returns"

export type ReturnsSummaryCardsProps = {
  /** Real counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminReturnSummary | null
}

/** Total / Requested / Approved / Completed / Rejected — compact row above the returns table (mirrors OrdersSummaryCards). */
function ReturnsSummaryCards({ summary }: ReturnsSummaryCardsProps) {
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <CompactStatCard icon={ClipboardList} label="Total Returns" value={format(summary?.total)} note="All time" tone="primary" />
      <CompactStatCard
        icon={Hourglass}
        label="Requested"
        value={format(summary?.requested)}
        note="Awaiting review"
        noteTone="attention"
        tone="warning"
      />
      <CompactStatCard
        icon={ThumbsUp}
        label="Approved"
        value={format(summary?.approved)}
        note="Being processed"
        tone="ai"
      />
      <CompactStatCard
        icon={CheckCircle2}
        label="Completed"
        value={format(summary?.completed)}
        note="Fully resolved"
        noteTone="positive"
        tone="success"
      />
      <CompactStatCard icon={XCircle} label="Rejected" value={format(summary?.rejected)} note="Not eligible" tone="destructive" />
    </div>
  )
}

export { ReturnsSummaryCards }
