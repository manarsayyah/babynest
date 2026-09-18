import * as React from "react"
import { Sparkles } from "lucide-react"
import { cn } from "cn"

/** Small "AI"-tag used next to headings/results that come from an AI feature. */
function AIBadge({
  label = "AI",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <span
      data-slot="ai-badge"
      className={cn(
        "text-eyebrow inline-flex items-center gap-1 rounded-full border border-ai-border bg-ai-muted px-2.5 py-1 text-ai-muted-foreground",
        className
      )}
    >
      <Sparkles className="size-3" />
      {label}
    </span>
  )
}

export { AIBadge }
