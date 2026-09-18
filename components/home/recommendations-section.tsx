"use client"

import * as React from "react"
import Link from "next/link"
import { Sparkles, TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { SectionHeader } from "@/components/layout/section-header"
import { AIBadge } from "@/components/ai/ai-badge"
import { useAiRecommendations } from "@/components/ai/use-ai-recommendations"
import { ProductCard } from "@/components/product/product-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/components/providers/cart-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"

/** How many picks the rail shows — one row at the widest layout, same as the original design. */
const RAIL_SIZE = 4

/**
 * "Recommended for you" rail. Sits on a soft violet-tinted band to signal AI origin without restyling the
 * product cards themselves. Shows the signed-in customer's real recommendations from the AI backend; guests
 * are invited to sign in rather than shown placeholder products.
 */
function RecommendationsSection() {
  const state = useAiRecommendations()
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const { addProduct } = useCart()

  return (
    <section className="section-y bg-ai-muted/40">
      <Container className="flex flex-col gap-8">
        <SectionHeader
          eyebrow={<AIBadge label="Personalized for you" />}
          title="Recommended for Your Baby"
          description="Based on what you shop, save and browse — this gets sharper as you use BabyNest."
        />

        {state.status === "guest" ? (
          <EmptyState
            icon={Sparkles}
            title="Sign in for personalized picks"
            description="Your recommendations are based on your own orders, wishlist and cart."
            action={
              <Button nativeButton={false} render={<Link href="/login?callbackUrl=/" />}>
                Sign in
              </Button>
            }
          />
        ) : state.status === "loading" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: RAIL_SIZE }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : state.status === "error" ? (
          <EmptyState
            icon={TriangleAlert}
            title="Recommendations are unavailable"
            description={state.message}
            action={
              <Button variant="outline" onClick={state.retry}>
                Try again
              </Button>
            }
          />
        ) : state.items.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description="Browse and shop a little and we'll have suggestions for you."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {state.items.slice(0, RAIL_SIZE).map((product) => (
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
        )}
      </Container>
    </section>
  )
}

export { RecommendationsSection }
