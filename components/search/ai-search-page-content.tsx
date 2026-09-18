"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Container } from "@/components/layout/container"
import { AIHero } from "@/components/search/ai-hero"
import { PreferencesSidebar } from "@/components/search/preferences-sidebar"
import { AIRecommendationsGrid, type AISearchStatus } from "@/components/search/ai-recommendations-grid"
import { fetchCategories } from "@/lib/api-client/categories"
import {
  aiSearch,
  buildSearchQuery,
  defaultPreferenceFilters,
  type AiOutcome,
  type AiSearchData,
  type PreferenceFilters,
} from "@/lib/api-client/ai"
import { ageBuckets } from "@/lib/mock/filters"
import type { ApiCategory } from "@/lib/api-client/types"

function ageLabelFor(key: string | null) {
  return key ? (ageBuckets.find((bucket) => bucket.key === key)?.label ?? null) : null
}

/** Full AI Smart Search page: hero + search bar, results grid, preferences sidebar — backed by POST /api/ai/search. */
function AISearchPageContent() {
  const searchParams = useSearchParams()
  // A query handed over from the home page's Smart Search box (?q=...).
  const initialQuery = searchParams.get("q")?.trim() ?? ""

  const [categories, setCategories] = React.useState<ApiCategory[]>([])
  const [query, setQuery] = React.useState(initialQuery)
  const [filters, setFilters] = React.useState<PreferenceFilters>(defaultPreferenceFilters)
  const [status, setStatus] = React.useState<AISearchStatus>(initialQuery ? "loading" : "idle")
  const [data, setData] = React.useState<AiSearchData | null>(null)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  // Synchronous guard against duplicate submissions while a request is pending.
  const inFlightRef = React.useRef(false)
  const autoRanRef = React.useRef(false)

  React.useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      try {
        const result = await fetchCategories()
        if (!cancelled) setCategories(result)
      } catch {
        // The category filter simply stays empty; search itself doesn't depend on it.
      }
    }

    void loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  const categoryOptions = React.useMemo(
    () => categories.map((category) => ({ slug: category.slug, name: category.name })),
    [categories]
  )

  function buildQuery(text: string, nextFilters: PreferenceFilters) {
    const categoryName = categories.find((category) => category.slug === nextFilters.category)?.name ?? null
    return buildSearchQuery(text, nextFilters, ageLabelFor(nextFilters.ageBucketKey), categoryName)
  }

  function applyOutcome(outcome: AiOutcome<AiSearchData>) {
    inFlightRef.current = false
    if (outcome.ok) {
      setData(outcome.data)
      setErrorMessage(null)
      setStatus("ready")
    } else {
      setData(null)
      setErrorMessage(outcome.message)
      setStatus("error")
    }
  }

  // Runs the query handed over from the home page exactly once (refs guard against StrictMode / re-renders).
  React.useEffect(() => {
    if (!initialQuery || autoRanRef.current) return
    autoRanRef.current = true
    inFlightRef.current = true
    void aiSearch(buildSearchQuery(initialQuery, defaultPreferenceFilters, ageLabelFor(defaultPreferenceFilters.ageBucketKey), null)).then(
      applyOutcome
    )
    // applyOutcome only touches state setters and a ref; running once on mount is intentional.
  }, [initialQuery])

  async function runSearch(nextQuery: string, nextFilters: PreferenceFilters) {
    if (inFlightRef.current) return
    if (!nextQuery.trim()) {
      toast.error("Describe what your baby needs first")
      return
    }
    inFlightRef.current = true
    setStatus("loading")
    applyOutcome(await aiSearch(buildQuery(nextQuery, nextFilters)))
  }

  function handleReset() {
    if (inFlightRef.current) return
    setQuery("")
    setFilters(defaultPreferenceFilters)
    setData(null)
    setErrorMessage(null)
    setStatus("idle")
  }

  return (
    <main className="flex-1">
      <AIHero
        query={query}
        onQueryChange={setQuery}
        onSubmit={() => void runSearch(query, filters)}
        isLoading={status === "loading"}
      />

      <Container className="section-y grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        <AIRecommendationsGrid
          status={status}
          results={data?.products ?? []}
          summary={data?.summary ?? null}
          errorMessage={errorMessage}
          onRetry={() => void runSearch(query, filters)}
          onReset={handleReset}
        />

        <PreferencesSidebar
          value={filters}
          onChange={setFilters}
          onUpdate={() => void runSearch(query, filters)}
          categoryOptions={categoryOptions}
          isLoading={status === "loading"}
          className="lg:sticky lg:top-20"
        />
      </Container>
    </main>
  )
}

export { AISearchPageContent }
