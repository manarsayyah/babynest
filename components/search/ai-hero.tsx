"use client"

import { Bot, Loader2, Moon, Sparkles, Star, Wand2 } from "lucide-react"
import { Container } from "@/components/layout/container"
import { SearchInput } from "@/components/ui/search-input"
import { Button } from "@/components/ui/button"

export type AIHeroProps = {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
}

/** Page header: heading, subtext, AI search bar + "Get Recommendations", decorative bot/moon accents. */
function AIHero({ query, onQueryChange, onSubmit, isLoading }: AIHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-accent/50 via-background to-background">
      <Container className="flex flex-col items-center gap-7 py-14 text-center lg:py-16">
        <div className="relative flex w-full max-w-2xl flex-col items-center gap-3">
          <span
            aria-hidden
            className="absolute top-1/2 left-0 hidden -translate-x-[120%] -translate-y-1/2 items-center justify-center lg:flex"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-ai/15 text-ai ring-1 ring-ai-border">
              <Bot className="size-8" />
            </span>
          </span>

          <span
            aria-hidden
            className="absolute top-1/2 right-0 hidden -translate-y-1/2 translate-x-[110%] items-center gap-2 lg:flex"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-card text-ai shadow-md">
              <Moon className="size-4" />
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-card text-warning shadow-md">
              <Star className="size-3.5" />
            </span>
          </span>

          <h1 className="text-display text-foreground">
            Find What Your Baby Needs — Smarter
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Our AI understands your needs and finds the best products for your baby.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <SearchInput
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onClear={() => onQueryChange("")}
            placeholder="I need safe newborn essentials under $200"
            aria-label="Describe what your baby needs"
            containerClassName="flex-1"
          />
          <Button type="submit" size="lg" disabled={isLoading} className="shrink-0">
            {isLoading ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <Wand2 data-icon="inline-start" />
            )}
            Get Recommendations
          </Button>
        </form>

        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Sparkles className="size-3.5 text-ai" />
          Try: &quot;soft educational toys for a 6 month old under $30&quot;
        </p>
      </Container>
    </section>
  )
}

export { AIHero }
