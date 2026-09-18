import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "cn"

const sizeMap = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const

type RatingProps = {
  /** Average rating, 0-5. Supports partial (half/quarter) fills. */
  value: number
  /** Number of reviews the rating is based on. Omit to hide the count. */
  count?: number
  size?: keyof typeof sizeMap
  className?: string
}

/** Read-only star rating display shared by product cards, product detail, and reviews. */
function Rating({ value, count, size = "sm", className }: RatingProps) {
  const clamped = Math.min(5, Math.max(0, value))
  const starSize = sizeMap[size]

  return (
    <div
      data-slot="rating"
      role="img"
      aria-label={`Rated ${clamped.toFixed(1)} out of 5${
        typeof count === "number" ? ` from ${count} reviews` : ""
      }`}
      className={cn("inline-flex items-center gap-1", className)}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.round(Math.min(100, Math.max(0, (clamped - i) * 100)))
          return (
            <span key={i} className={cn("relative inline-block", starSize)}>
              <Star className={cn("absolute inset-0 text-border", starSize)} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill}%` }}
              >
                <Star
                  className={cn(
                    "fill-warning text-warning",
                    starSize
                  )}
                />
              </span>
            </span>
          )
        })}
      </div>
      {typeof count === "number" ? (
        <span className="text-caption text-muted-foreground">({count})</span>
      ) : null}
    </div>
  )
}

export { Rating }
