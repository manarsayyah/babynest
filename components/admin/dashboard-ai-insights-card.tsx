"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { AIPanel } from "@/components/ai/ai-panel"
import { AIBadge } from "@/components/ai/ai-badge"
import { Button } from "@/components/ui/button"

/** "Store Insights" — real, database-counted highlights, with a link to the full AI Insights admin page. */
function DashboardAIInsightsCard({ highlights }: { highlights: string[] }) {
  const router = useRouter()

  return (
    <AIPanel className="p-5 sm:p-6">
      <AIBadge label="Store Insights" />
      <ul className="mt-4 flex flex-col gap-2.5">
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-small text-foreground">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ai" />
            {line}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => router.push("/admin/ai-insights")}>
          View AI Insights
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast("Report generation isn't available yet")
          }
        >
          Generate Report
        </Button>
      </div>
    </AIPanel>
  )
}

export { DashboardAIInsightsCard }
