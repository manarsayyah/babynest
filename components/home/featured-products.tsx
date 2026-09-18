"use client"

import * as React from "react"
import Link from "next/link"
import { PackageSearch, TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { SectionHeader } from "@/components/layout/section-header"
import { ProductCard } from "@/components/product/product-card"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/components/providers/cart-provider"
import { useWishlist } from "@/components/providers/wishlist-provider"
import { fetchProducts } from "@/lib/api-client/products"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { ApiProduct } from "@/lib/api-client/types"

const FEATURED_COUNT = 4
// The catalog has no "featured" flag, so the pick is derived from existing data: fetch the top-rated active
// products (GET /api/products already excludes inactive/deleted ones) and order them deterministically.
const CANDIDATE_POOL = 50

function pickFeatured(products: ApiProduct[]): ApiProduct[] {
  return [...products]
    .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name))
    .slice(0, FEATURED_COUNT)
}

/** Featured Products grid — the highest-rated active products from the real catalog. */
function FeaturedProducts() {
  const { isWishlisted, toggle: toggleWishlist } = useWishlist()
  const { addProduct } = useCart()
  const [products, setProducts] = React.useState<ApiProduct[] | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchProducts({ sort: "rating_desc", limit: CANDIDATE_POOL })
        if (cancelled) return
        setProducts(pickFeatured(result.items))
        setFailed(false)
      } catch {
        if (cancelled) return
        setProducts(null)
        setFailed(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  return (
    <section className="section-y">
      <Container className="flex flex-col gap-8">
        <SectionHeader
          title="Featured Products"
          description="Parent-loved picks, refreshed every week."
          action={{ href: "/products", label: "View all" }}
        />
        {failed ? (
          <EmptyState
            icon={TriangleAlert}
            title="Couldn't load featured products"
            description="Something went wrong. Please try again."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setFailed(false)
                  setReloadToken((n) => n + 1)
                }}
              >
                Try again
              </Button>
            }
          />
        ) : products === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: FEATURED_COUNT }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products available yet"
            description="Check back soon, or browse the full catalog."
            action={
              <Button variant="outline" nativeButton={false} render={<Link href="/products" />}>
                Browse products
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                href={`/products/${product.slug}`}
                imageSrc={product.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE}
                imageAlt={product.primaryImage?.altText ?? product.name}
                name={product.name}
                price={product.price}
                rating={product.rating}
                reviewCount={product.reviewCount}
                inWishlist={isWishlisted(product._id)}
                onToggleWishlist={() => toggleWishlist(product._id)}
                onAddToCart={() => void addProduct(product._id)}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  )
}

export { FeaturedProducts }
