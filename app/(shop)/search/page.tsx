import * as React from "react"
import type { Metadata } from "next"
import { AISearchPageContent } from "@/components/search/ai-search-page-content"

export const metadata: Metadata = {
  title: "AI Smart Search | BabyNest",
  description:
    "Describe what your baby needs in plain language and let BabyNest AI find the best-matching products.",
}

export default function AISearchPage() {
  // useSearchParams (for the ?q= handoff from the home page) needs a Suspense boundary.
  return (
    <React.Suspense>
      <AISearchPageContent />
    </React.Suspense>
  )
}
