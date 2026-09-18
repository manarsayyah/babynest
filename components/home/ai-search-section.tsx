"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bot, Sparkles } from "lucide-react"
import { Container } from "@/components/layout/container"
import { AIPanel } from "@/components/ai/ai-panel"
import { AIBadge } from "@/components/ai/ai-badge"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"

const EXAMPLE_QUERY = "Soft educational toys for a 6 month old baby under $30"

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
        <AIPanel className="grid items-center gap-8 lg:grid-cols-[1.2fr_auto]">
          <div className="flex flex-col items-start gap-4">
            <AIBadge label="AI Smart Search" />
            <h2 className="text-h2 text-foreground">
              Just describe what you need — we&apos;ll find it
            </h2>
            <p className="max-w-xl text-body text-muted-foreground">
              No filters to fuss with. Tell BabyNest what you&apos;re looking for in
              plain language — age, budget, occasion — and our AI understands the
              meaning behind your search to surface exactly the right products.
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
                Try Smart Search
              </Button>
            </form>
          </div>

          <div className="hidden justify-self-center lg:flex">
            <span className="flex size-28 items-center justify-center rounded-full bg-ai/15 text-ai ring-1 ring-ai-border">
              <Bot className="size-12" />
            </span>
          </div>
        </AIPanel>
      </Container>
    </section>
  )
}

export { AISearchSection }
