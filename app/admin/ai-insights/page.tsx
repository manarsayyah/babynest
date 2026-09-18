import type { Metadata } from "next"
import { AdminAIInsightsPageContent } from "@/components/admin/ai-insights/admin-ai-insights-page-content"

export const metadata: Metadata = { title: "AI Insights" }

export default function AdminAIInsightsPage() {
  return <AdminAIInsightsPageContent />
}
