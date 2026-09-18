import type { Metadata } from "next"
import { AIPreferencesPageContent } from "@/components/account/ai-preferences-page-content"

export const metadata: Metadata = {
  title: "AI Preferences | BabyNest",
  description: "Customize how BabyNest uses your preferences to personalize your shopping experience.",
}

export default function AIPreferencesPage() {
  return <AIPreferencesPageContent />
}
