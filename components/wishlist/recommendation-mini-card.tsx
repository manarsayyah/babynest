"use client"

import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/components/product/product-card"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { AiProduct } from "@/lib/api-client/ai"

export type RecommendationMiniCardProps = {
  product: AiProduct
  onAddToWishlist: () => void
  onAddToCart: () => void
}

/**
 * Small horizontal recommendation tile — deliberately not the full
 * `ProductCard` (square image + full footer) so this rail stays a compact
 * strip rather than a second product grid competing with the wishlist above.
 */
function RecommendationMiniCard({ product, onAddToWishlist, onAddToCart }: RecommendationMiniCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ai-border bg-card/70 p-2 pr-2.5">
      <Link
        href={`/products/${product.slug}`}
        className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image ?? PLACEHOLDER_PRODUCT_IMAGE} alt={product.name} className="size-full object-cover" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Link
          href={`/products/${product.slug}`}
          className="line-clamp-1 text-small font-medium text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1.5">
          <Badge variant="ai" className="h-4 px-1.5 text-[10px]">
            {product.matchPercent}% Match
          </Badge>
          <span className="text-small font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onAddToWishlist}
          aria-label={`Add ${product.name} to wishlist`}
          className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          <Heart className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          aria-label={`Add ${product.name} to cart`}
          className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <ShoppingCart className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export { RecommendationMiniCard }
