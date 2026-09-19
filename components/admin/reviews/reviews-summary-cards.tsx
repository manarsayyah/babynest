import { CheckCircle2, Clock, MessageSquareText, Star } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminReviewSummary } from "@/lib/api-client/admin-reviews"

export type ReviewsSummaryCardsProps = {
  /** Queue-wide counts from the server; null while loading (tiles show a dash rather than a fake zero). */
  summary: AdminReviewSummary | null
}

/** Total / Published / Pending / Average Rating — compact row above the reviews table. */
function ReviewsSummaryCards({ summary }: ReviewsSummaryCardsProps) {
  const format = (value: number | undefined) => (value === undefined ? "—" : value.toLocaleString("en-US"))

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={MessageSquareText}
        label="Total Reviews"
        value={format(summary?.total)}
        note="All time"
        tone="primary"
      />
      <CompactStatCard
        icon={CheckCircle2}
        label="Published"
        value={format(summary?.published)}
        note="Visible to shoppers"
        tone="success"
      />
      <CompactStatCard
        icon={Clock}
        label="Pending Review"
        value={format(summary?.pending)}
        note="Awaiting moderation"
        tone="warning"
      />
      <CompactStatCard
        icon={Star}
        label="Average Rating"
        value={summary ? summary.averageRating.toFixed(1) : "—"}
        note="Out of 5 stars"
        tone="ai"
      />
    </div>
  )
}

export { ReviewsSummaryCards }
