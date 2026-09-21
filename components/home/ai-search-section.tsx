"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bot, Sparkles } from "lucide-react"
import { Container } from "@/components/layout/container"
import { AIPanel } from "@/components/ai/ai-panel"
import { AIBadge } from "@/components/ai/ai-badge"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"

const EXAMPLE_QUERY = "Soft toys for a 6 month old"

/** Introduces AI Smart Search with the distinct violet AI visual language. */
function AISearchSection() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")

  // Hands the description over to the real Smart Search page, which runs it against the catalog.
  function goToSearch() {
    const text = query.trim()
    router.push(text ? `/search?q=${encodeURIComponent(text)}` : "/search")
  }

  return (
    <section className="section-y">
      <Container>
        <AIPanel>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
            <div className="flex flex-col items-start gap-4">
              <AIBadge label="AI Smart Search" />
              <h2 className="text-h2 text-foreground">
                Smart Shopping, Made for Parents
              </h2>
              <p className="max-w-xl text-body text-muted-foreground">
                Describe what you need in your own words — age, budget, occasion —
                and BabyNest finds the right products, with recommendations that
                get more personal the more you shop.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  goToSearch()
                }}
                className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
              >
                <SearchInput
                  ai
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClear={() => setQuery("")}
                  placeholder={EXAMPLE_QUERY}
                  aria-label="Describe what you're looking for"
                  containerClassName="flex-1"
                />
                <Button type="submit" variant="ai" size="lg">
                  <Sparkles data-icon="inline-start" />
                  Start Smart Search
                </Button>
              </form>
            </div>

            <div className="hidden justify-self-center lg:flex lg:pr-6">
              <span className="flex size-28 items-center justify-center rounded-full bg-ai/15 text-ai ring-1 ring-ai-border">
                <Bot className="size-12" />
              </span>
            </div>
          </div>
        </AIPanel>
      </Container>
    </section>
  )
}

export { AISearchSection }
