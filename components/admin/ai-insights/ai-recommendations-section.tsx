"use client"

import { toast } from "sonner"
import { Layers, Megaphone, PackagePlus, Sparkles, Star } from "lucide-react"
import type { ElementType } from "react"
import { AIBadge } from "@/components/ai/ai-badge"
import { AIPanel } from "@/components/ai/ai-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import {
  getAIRecommendations,
  type AIRecommendationInsight,
  type AIRecommendationType,
} from "@/lib/mock/admin-ai-insights"

const iconByType: Record<AIRecommendationType, ElementType> = {
  restock: PackagePlus,
  promote: Megaphone,
  bundle: Layers,
  highlight: Star,
}

const actionLabelByType: Record<AIRecommendationType, string> = {
  restock: "Create Purchase Order",
  promote: "Create Promotion",
  bundle: "Create Bundle",
  highlight: "Feature Product",
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

function RecommendationCard({ recommendation }: { recommendation: AIRecommendationInsight }) {
  const Icon = iconByType[recommendation.type]

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
      <Button
        variant="secondary"
        size="sm"
        className="mt-auto self-start"
        onClick={() =>
          toast(`${actionLabelByType[recommendation.type]} isn't wired up yet`, {
            description: "This is a frontend-only demo.",
          })
        }
      >
        {actionLabelByType[recommendation.type]}
      </Button>
    </div>
  )
}

/** "AI Recommendations" — the visually distinct, elegant AI surface, driven by the same derived mock signals. */
function AIRecommendationsSection() {
  const recommendations = getAIRecommendations()

  return (
    <AIPanel>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <AIBadge label="AI Recommendations" />
          <p className="text-small text-muted-foreground">
            Suggested next steps generated from your current catalog, orders, and customer data.
          </p>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recommendations.map((recommendation) => (
              <RecommendationCard key={recommendation.id} recommendation={recommendation} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No insights available yet"
            description="Once your store has enough data, AI insights will appear here."
          />
        )}
      </div>
    </AIPanel>
  )
}

export { AIRecommendationsSection }
