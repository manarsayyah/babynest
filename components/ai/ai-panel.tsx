import * as React from "react"
import { cn } from "cn"

/**
 * Shared "premium AI surface" — the visual base for the Smart Search bar,
 * the Shopping Assistant panel, and personalized-recommendation rails.
 * Distinct from commerce chrome (violet accent, soft glow, subtle gradient)
 * while still sitting on the same radius/shadow/typography system as the
 * rest of BabyNest — intelligent and premium, not futuristic or robotic.
 */
function AIPanel({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="ai-panel"
      className={cn(
        "relative overflow-hidden rounded-3xl border border-ai-border bg-gradient-to-br from-ai-muted via-card to-card p-6 shadow-ai sm:p-8",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-ai/20 blur-3xl"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

export { AIPanel }
