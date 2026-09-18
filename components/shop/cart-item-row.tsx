"use client"

import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import { formatPrice } from "@/components/product/product-card"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"
import type { ApiCartItem } from "@/lib/api-client/types"

export type CartItemRowProps = {
  item: ApiCartItem
  /** Displayed quantity — the server value, or the value being saved. */
  quantity: number
  selected: boolean
  onToggleSelect: () => void
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onMoveToWishlist: () => void
}

/** One cart row — checkbox, image/name/actions, price, quantity, line total. Stacks on mobile. */
function CartItemRow({
  item,
  quantity,
  selected,
  onToggleSelect,
  onQuantityChange,
  onRemove,
  onMoveToWishlist,
}: CartItemRowProps) {
  const name = item.product?.name ?? "Unavailable item"
  const slug = item.product?.slug
  const variantLabel = [item.variant?.color, item.variant?.size].filter(Boolean).join(" · ")
  const stockQty = item.variant?.stockQty ?? 0
  const availabilityMessage =
    item.availability === "unavailable"
      ? "No longer available"
      : item.availability === "out_of_stock"
        ? "Out of stock"
        : item.availability === "insufficient_stock"
          ? `Only ${stockQty} left in stock`
          : null

  return (
    <div className="flex flex-col gap-4 border-b border-border py-5 last:border-0 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-start gap-3 sm:items-center">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select ${name}`}
          className="mt-1 sm:mt-0"
        />
        <Link
          href={slug ? `/products/${slug}` : "/products"}
          className="size-16 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10 sm:size-20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image ?? PLACEHOLDER_PRODUCT_IMAGE} alt={name} className="size-full object-cover" />
        </Link>
        <div className="flex flex-col gap-1">
          <Link
            href={slug ? `/products/${slug}` : "/products"}
            className="text-small font-semibold text-foreground hover:text-primary"
          >
            {name}
          </Link>
          {variantLabel ? <span className="text-caption text-muted-foreground">{variantLabel}</span> : null}
          {availabilityMessage ? (
            <span className="text-caption font-medium text-destructive">{availabilityMessage}</span>
          ) : null}
          <div className="flex items-center gap-2 text-caption">
            <button
              type="button"
              onClick={onRemove}
              className="text-destructive hover:underline"
            >
              Remove
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={onMoveToWishlist}
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              Move to Wishlist
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pl-9 sm:w-24 sm:justify-center sm:pl-0">
        <span className="text-caption text-muted-foreground sm:hidden">Price</span>
        <span className="text-small text-foreground">{formatPrice(item.unitPrice)}</span>
      </div>

      <div className="flex items-center justify-between gap-4 pl-9 sm:w-28 sm:justify-center sm:pl-0">
        <span className="text-caption text-muted-foreground sm:hidden">Quantity</span>
        <QuantityStepper
          value={quantity}
          onChange={onQuantityChange}
          max={Math.max(1, Math.min(99, stockQty))}
          size="sm"
        />
      </div>

      <div className="flex items-center justify-between gap-4 pl-9 sm:w-24 sm:justify-end sm:pl-0">
        <span className="text-caption text-muted-foreground sm:hidden">Total</span>
        <span className="text-small font-semibold text-foreground">
          {formatPrice(item.unitPrice * quantity)}
        </span>
      </div>
    </div>
  )
}

export { CartItemRow }
