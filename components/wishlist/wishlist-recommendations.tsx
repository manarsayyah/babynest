"use client"

import { AIPanel } from "@/components/ai/ai-panel"
import { AIBadge } from "@/components/ai/ai-badge"
import { RecommendationMiniCard } from "@/components/wishlist/recommendation-mini-card"
import type { AiProduct } from "@/lib/api-client/ai"

export type WishlistRecommendationsProps = {
  items: AiProduct[]
  onAddToWishlist: (id: string) => void
  onAddToCart: (id: string) => void
}

/**
 * "Recommended For You" — a compact strip, not a second product grid. The
 * wishlist above stays the focus of the page; this is deliberately small.
 */
function WishlistRecommendations({ items, onAddToWishlist, onAddToCart }: WishlistRecommendationsProps) {
  if (items.length === 0) return null

  return (
    <AIPanel className="p-3.5 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-start sm:gap-1">
          <AIBadge label="Recommended For You" />
          <p className="hidden text-caption text-muted-foreground sm:block">
            Based on your wishlist
          </p>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
          {items.map((product) => (
            <RecommendationMiniCard
              key={product.id}
              product={product}
              onAddToWishlist={() => onAddToWishlist(product.id)}
              onAddToCart={() => onAddToCart(product.id)}
            />
          ))}
        </div>
      </div>
    </AIPanel>
  )
}

export { WishlistRecommendations }
