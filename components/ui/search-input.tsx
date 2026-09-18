"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"

type SearchInputProps = React.ComponentProps<"input"> & {
  /** Switches to the AI visual language (violet ring/border) for Smart Search contexts. */
  ai?: boolean
  containerClassName?: string
  onClear?: () => void
}

/**
 * Pill-shaped search field used by both the standard catalog search and the
 * AI Smart Search bar (via the `ai` prop) so the two share one visual base.
 */
function SearchInput({
  className,
  containerClassName,
  ai = false,
  value,
  onClear,
  ...props
}: SearchInputProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value)

  return (
    <div
      data-slot="search-input"
      className={cn(
        "relative flex w-full items-center",
        containerClassName
      )}
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-3.5 size-4 text-muted-foreground",
          ai && "text-ai"
        )}
      />
      <Input
        type="search"
        value={value}
        className={cn(
          "h-11 w-full rounded-full border-input bg-card pr-9 pl-10 text-sm shadow-xs [&::-webkit-search-cancel-button]:hidden",
          ai &&
            "border-ai-border bg-ai-muted/40 focus-visible:border-ai focus-visible:ring-ai/40",
          className
        )}
        {...props}
      />
      {hasValue && onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3.5 flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export { SearchInput }
