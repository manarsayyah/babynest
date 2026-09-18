"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "cn"

export type QuantityStepperProps = {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: "sm" | "md"
  className?: string
}

/** Pill -/+ quantity control shared by the product detail page and the cart. */
function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QuantityStepperProps) {
  const buttonSize = size === "sm" ? "size-8" : "size-10"

  return (
    <div className={cn("inline-flex items-center rounded-full border border-input", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className={cn(
          buttonSize,
          "flex items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        )}
      >
        <Minus className="size-3.5" />
      </button>
      <span
        className={cn(
          "text-center text-small font-medium text-foreground",
          size === "sm" ? "w-6" : "w-8"
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          buttonSize,
          "flex items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-40"
        )}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export { QuantityStepper }
