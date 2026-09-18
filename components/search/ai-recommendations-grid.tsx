"use client"

import { Loader2, SearchX, Sparkles, TriangleAlert } from "lucide-react"
import { SectionHeader } from "@/components/layout/section-header"
import { AIBadge } from "@/components/ai/ai-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product/product-card"
import { useCart } from "@/components/providers/cart-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { AiProduct } from "@/lib/api-client/ai"

export type AISearchStatus = "idle" | "loading" | "ready" | "error"

export type AIRecommendationsGridProps = {
  status: AISearchStatus
  results: AiProduct[]
  /** The AI's short, catalog-grounded answer to the query, if any. */
  summary: string | null
  errorMessage: string | null
  onRetry: () => void
  onReset: () => void
}

/** "AI Recommendations for You" — idle/loading/error/empty states, or the match-scored grid of real products. */
function AIRecommendationsGrid({ status, results, summary, errorMessage, onRetry, onReset }: AIRecommendationsGridProps) {
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const { addProduct } = useCart()

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader eyebrow={<AIBadge label="AI Recommended" />} title="AI Recommendations for You" />

      {status === "loading" ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
          <Loader2 className="size-6 animate-spin text-ai" />
          <p className="text-small text-muted-foreground">Finding the best matches for your baby...</p>
        </div>
      ) : status === "error" ? (
        <EmptyState
          icon={TriangleAlert}
          title="Smart Search is unavailable"
          description={errorMessage ?? "Our AI is unavailable right now. Please try again in a moment."}
          action={
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          }
        />
      ) : status === "idle" ? (
        <EmptyState
          icon={Sparkles}
          title="Describe what your baby needs"
          description="Tell us in your own words — age, budget, occasion — and we'll find matching products from our catalog."
        />
      ) : (
        <>
          {summary ? <p className="text-small text-muted-foreground">{summary}</p> : null}
          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/products/${product.slug}`}
                  imageSrc={product.image ?? PLACEHOLDER_PRODUCT_IMAGE}
                  imageAlt={product.name}
                  name={product.name}
                  price={product.price}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  badge={{ label: `${product.matchPercent}% Match`, tone: "ai" }}
                  inWishlist={isWishlisted(product.id)}
                  onToggleWishlist={() => toggleWishlist(product.id)}
                  onAddToCart={() => void addProduct(product.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No matches found"
              description="Try a different description, or reset your preferences to start over."
              action={
                <Button variant="outline" onClick={onReset}>
                  Reset preferences
                </Button>
              }
            />
          )}
        </>
      )}
    </div>
  )
}

export { AIRecommendationsGrid }
