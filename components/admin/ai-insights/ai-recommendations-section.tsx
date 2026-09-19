"use client"

import { useRouter } from "next/navigation"
import { Layers, Megaphone, PackagePlus, Sparkles, Star } from "lucide-react"
import type { ElementType } from "react"
import { AIBadge } from "@/components/ai/ai-badge"
import { AIPanel } from "@/components/ai/ai-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import type { AdminInsights, InsightsRecommendationType } from "@/lib/api-client/admin-insights"

type Recommendation = AdminInsights["recommendations"][number]

const iconByType: Record<InsightsRecommendationType, ElementType> = {
  restock: PackagePlus,
  promote: Megaphone,
  bundle: Layers,
  highlight: Star,
}

// Each action goes somewhere real: stock lives in Admin Products; the other three open the actual product in the store.
const actionLabelByType: Record<InsightsRecommendationType, string> = {
  restock: "Manage Stock",
  promote: "View Product",
  bundle: "View Product",
  highlight: "View Product",
}

const priorityBadgeVariant = {
  high: "warning",
  medium: "ai",
  low: "outline",
} as const

const priorityLabel = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
} as const

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const router = useRouter()
  const Icon = iconByType[recommendation.type]

  function handleAction() {
    if (recommendation.type === "restock") {
      router.push("/admin/products")
    } else if (recommendation.product) {
      window.open(`/products/${recommendation.product.slug}`, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ai-border bg-card/70 p-4 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ai-muted text-ai">
          <Icon className="size-4" />
        </span>
        <Badge variant={priorityBadgeVariant[recommendation.priority]}>
          {priorityLabel[recommendation.priority]}
        </Badge>
      </div>
      <div>
        <p className="text-small font-semibold text-foreground">{recommendation.title}</p>
        <p className="mt-1 text-caption text-muted-foreground">{recommendation.description}</p>
      </div>
      <Button variant="secondary" size="sm" className="mt-auto self-start" onClick={handleAction}>
        {actionLabelByType[recommendation.type]}
      </Button>
    </div>
  )
}

export type AIRecommendationsSectionProps = {
  recommendations: Recommendation[] | null
}

/**
 * "Store Recommendations" — the page's visually distinct surface. These are deterministic rules over the store's real
 * products, orders and reviews (no AI model is called), so the copy says exactly that rather than claiming AI output.
 */
function AIRecommendationsSection({ recommendations }: AIRecommendationsSectionProps) {
  return (
    <AIPanel>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <AIBadge label="Store Recommendations" />
          <p className="text-small text-muted-foreground">
            Suggested next steps calculated from your real catalog, orders, and reviews. These are rule-based — no AI
            model is involved.
          </p>
        </div>

        {recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description="Once your store has enough sales, stock and review data, suggested next steps will appear here."
          />
        )}
      </div>
    </AIPanel>
  )
}

export { AIRecommendationsSection }
