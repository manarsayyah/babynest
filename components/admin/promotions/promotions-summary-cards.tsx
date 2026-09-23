import { BadgeCheck, PauseCircle, Tag, Zap } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminPromotionSummary } from "@/lib/api-client/admin-promotions"

export type PromotionsSummaryCardsProps = {
  /** Real counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminPromotionSummary | null
}

/** Total / Active / Live Now / Inactive — compact one-row summary above the promotions table. */
function PromotionsSummaryCards({ summary }: PromotionsSummaryCardsProps) {
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard icon={Tag} label="Total Promotions" value={format(summary?.total)} note="All codes ever created" tone="primary" />
      <CompactStatCard
        icon={BadgeCheck}
        label="Active"
        value={format(summary?.active)}
        note="Enabled by an admin"
        noteTone="positive"
        tone="success"
      />
      <CompactStatCard
        icon={Zap}
        label="Live Now"
        value={format(summary?.liveNow)}
        note="Active and in date range"
        noteTone="positive"
        tone="ai"
      />
      <CompactStatCard
        icon={PauseCircle}
        label="Inactive"
        value={format(summary?.inactive)}
        note="Disabled by an admin"
        noteTone="attention"
        tone="warning"
      />
    </div>
  )
}

export { PromotionsSummaryCards }
