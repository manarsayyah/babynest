import { CheckCircle2, Clock, MessageSquareText, Star } from "lucide-react"
import { CompactStatCard } from "@/components/admin/compact-stat-card"
import type { AdminReview } from "@/lib/mock/admin-reviews"

export type ReviewsSummaryCardsProps = {
  reviews: AdminReview[]
}

/** Total / Published / Pending / Average Rating — compact row above the reviews table. */
function ReviewsSummaryCards({ reviews }: ReviewsSummaryCardsProps) {
  const total = reviews.length
  const published = reviews.filter((r) => r.status === "published").length
  const pending = reviews.filter((r) => r.status === "pending").length
  const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <CompactStatCard
        icon={MessageSquareText}
        label="Total Reviews"
        value={total.toLocaleString("en-US")}
        note="All time"
        tone="primary"
      />
      <CompactStatCard
        icon={CheckCircle2}
        label="Published"
        value={published.toLocaleString("en-US")}
        note="Visible to shoppers"
        tone="success"
      />
      <CompactStatCard
        icon={Clock}
        label="Pending Review"
        value={pending.toLocaleString("en-US")}
        note="Awaiting moderation"
        tone="warning"
      />
      <CompactStatCard
        icon={Star}
        label="Average Rating"
        value={average.toFixed(1)}
        note="Out of 5 stars"
        tone="ai"
      />
    </div>
  )
}

export { ReviewsSummaryCards }
