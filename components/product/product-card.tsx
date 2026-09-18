"use client"

import * as React from "react"
import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Rating } from "@/components/product/rating"
import { formatPrice } from "@/lib/format"

export { formatPrice }

export type ProductBadge = {
  label: string
  tone?: "primary" | "success" | "warning" | "ai"
}

export const badgeVariantByTone: Record<NonNullable<ProductBadge["tone"]>, "default" | "success" | "warning" | "ai"> = {
  primary: "default",
  success: "success",
  warning: "warning",
  ai: "ai",
}

export type ProductCardProps = {
  href: string
  imageSrc: string
  imageAlt: string
  name: string
  price: number
  compareAtPrice?: number
  currency?: string
  rating?: number
  reviewCount?: number
  badge?: ProductBadge
  inWishlist?: boolean
  onToggleWishlist?: () => void
  onAddToCart?: () => void
  className?: string
}

/**
 * Shared product tile — catalog grid, search results, "you may also like"
 * and recommendation rails all render this same component so the product
 * image area and price/rating layout stay pixel-identical across the app.
 */
function ProductCard({
  href,
  imageSrc,
  imageAlt,
  name,
  price,
  compareAtPrice,
  currency = "USD",
  rating,
  reviewCount,
  badge,
  inWishlist = false,
  onToggleWishlist,
  onAddToCart,
  className,
}: ProductCardProps) {
  const onSale = typeof compareAtPrice === "number" && compareAtPrice > price

  return (
    <div
      data-slot="product-card"
      className={cn(
        "group/product relative flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-xs transition-shadow hover:shadow-md",
        className
      )}
    >
      <Link
        href={href}
        className="relative block aspect-square overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="size-full object-cover transition-transform duration-300 ease-out group-hover/product:scale-105"
          loading="lazy"
        />

        {badge ? (
          <Badge
            variant={badgeVariantByTone[badge.tone ?? "primary"]}
            className="absolute left-2.5 top-2.5"
          >
            {badge.label}
          </Badge>
        ) : null}
      </Link>

      {onToggleWishlist ? (
        <button
          type="button"
          onClick={onToggleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={inWishlist}
          className="absolute right-2.5 top-2.5 flex size-8 items-center justify-center rounded-full bg-card/90 text-foreground shadow-xs backdrop-blur transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Heart
            className={cn(
              "size-4",
              inWishlist ? "fill-primary text-primary" : "text-foreground"
            )}
          />
        </button>
      ) : null}

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <Link
          href={href}
          className="line-clamp-2 text-small font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:underline"
        >
          {name}
        </Link>

        {typeof rating === "number" ? (
          <Rating value={rating} count={reviewCount} size="sm" />
        ) : null}

        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-body font-semibold text-foreground">
              {formatPrice(price, currency)}
            </span>
            {onSale ? (
              <span className="text-caption text-muted-foreground line-through">
                {formatPrice(compareAtPrice, currency)}
              </span>
            ) : null}
          </div>

          {onAddToCart ? (
            <button
              type="button"
              onClick={onAddToCart}
              aria-label={`Add ${name} to cart`}
              className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ShoppingCart className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { ProductCard }
