"use client"

import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/layout/container"
import { SectionHeader } from "@/components/layout/section-header"
import { fetchProducts } from "@/lib/api-client/products"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import { formatPrice } from "@/lib/format"
import type { ApiProduct } from "@/lib/api-client/types"
import { pickNewest } from "@/components/home/product-picks"

const COUNT = 4
const CANDIDATE_POOL = 30

/** Compact "New Arrivals" strip — the newest active products from the real catalog. Renders nothing if unavailable. */
function NewArrivalsSection() {
  const [products, setProducts] = React.useState<ApiProduct[]>([])

  React.useEffect(() => {
    let cancelled = false
    fetchProducts({ sort: "newest", limit: CANDIDATE_POOL })
      .then((result) => {
        if (!cancelled) setProducts(pickNewest(result.items, COUNT))
      })
      .catch(() => {
        if (!cancelled) setProducts([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (products.length === 0) return null

  return (
    <section className="section-y bg-secondary/40">
      <Container className="flex flex-col gap-6">
        <SectionHeader
          title="New Arrivals"
          description="The latest additions to the BabyNest catalog."
          action={{ href: "/products", label: "Browse all" }}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product._id}
              href={`/products/${product.slug}`}
              className="group/arrival flex items-center gap-4 rounded-xl bg-card p-3.5 ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE}
                alt={product.primaryImage?.altText ?? product.name}
                loading="lazy"
                className="size-20 shrink-0 rounded-lg bg-muted object-cover"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="line-clamp-2 text-small font-medium text-foreground group-hover/arrival:text-primary">
                  {product.name}
                </span>
                <span className="text-small font-semibold text-foreground">{formatPrice(product.price)}</span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}

export { NewArrivalsSection }
