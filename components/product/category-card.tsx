import * as React from "react"
import Link from "next/link"
import { cn } from "cn"

export type CategoryCardProps = {
  href: string
  imageSrc: string
  imageAlt: string
  name: string
  /** Soft pastel tint behind the image circle, e.g. "bg-[#EAF3EC]". Keeps the
   * "Shop by Category" row varied without leaning on the primary rose for
   * every tile. */
  tintClassName?: string
  className?: string
}

/** Circular category tile used in "Shop by Category" rails. */
function CategoryCard({
  href,
  imageSrc,
  imageAlt,
  name,
  tintClassName = "bg-muted",
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group/category flex w-full flex-col items-center gap-2.5 rounded-2xl p-2 text-center transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <span
        className={cn(
          "flex size-20 items-center justify-center overflow-hidden rounded-full ring-1 ring-foreground/10 transition-transform duration-300 group-hover/category:scale-105 sm:size-24",
          tintClassName
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={imageAlt} className="size-[68%] object-contain" />
      </span>
      <span className="text-small font-medium text-foreground">{name}</span>
    </Link>
  )
}

export { CategoryCard }
