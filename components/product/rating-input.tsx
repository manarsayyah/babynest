"use client"

import * as React from "react"
import { Star } from "lucide-react"
import { cn } from "cn"

export type RatingInputProps = {
  value: number
  onChange: (value: number) => void
  className?: string
}

/** Interactive 1-5 star picker — the editable counterpart to the read-only `Rating` display component. */
function RatingInput({ value, onChange, className }: RatingInputProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div className={cn("flex items-center gap-1", className)} onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          aria-label={`Rate ${star} out of 5`}
          aria-pressed={value === star}
          className="p-0.5"
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              star <= display ? "fill-warning text-warning" : "text-border"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export { RatingInput }
