import * as React from "react"
import { cn } from "cn"

export type EmptyStateProps = {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/** Shared "nothing here" placeholder — empty product grid, empty cart, empty wishlist, etc. */
function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center",
        className
      )}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      ) : null}
      <h3 className="text-h3 text-foreground">{title}</h3>
      {description ? (
        <p className="max-w-sm text-small text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  )
}

export { EmptyState }
