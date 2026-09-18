"use client"

import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Rating } from "@/components/product/rating"
import { formatPrice } from "@/components/product/product-card"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"

export type WishlistRowItem = {
  productId: string
  slug: string
  name: string
  price: number
  rating: number
  reviewCount: number
  imageSrc?: string
}

export type WishlistListRowProps = {
  item: WishlistRowItem
  categoryLabel: string
  onRemove: () => void
  onAddToCart: () => void
}

/** Horizontal row layout for wishlist "list view" — same data as the ProductCard grid, denser presentation. */
function WishlistListRow({ item, categoryLabel, onRemove, onAddToCart }: WishlistListRowProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border py-4 last:border-0 sm:flex-row sm:items-center">
      <Link
        href={`/products/${item.slug}`}
        className="size-20 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imageSrc ?? PLACEHOLDER_PRODUCT_IMAGE} alt={item.name} className="size-full object-cover" />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <Link
              href={`/products/${item.slug}`}
              className="text-small font-semibold text-foreground hover:text-primary"
            >
              {item.name}
            </Link>
            <span className="text-caption text-muted-foreground">{categoryLabel}</span>
          </div>
        </div>
        <Rating value={item.rating} count={item.reviewCount} size="sm" />
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:gap-1.5">
        <span className="text-small font-semibold text-foreground">{formatPrice(item.price)}</span>
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        <Button size="sm" onClick={onAddToCart} className="flex-1 sm:flex-none">
          <ShoppingCart data-icon="inline-start" />
          Add to Cart
        </Button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name} from wishlist`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
        >
          <Heart className="size-4 fill-primary" />
        </button>
      </div>
    </div>
  )
}

export { WishlistListRow }
