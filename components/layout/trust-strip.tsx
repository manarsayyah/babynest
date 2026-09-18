import * as React from "react"
import { cn } from "cn"

export type TrustStripItem = {
  icon: React.ElementType
  title: string
  description: string
}

const lgColsClass: Record<number, string> = {
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
}

/** Icon + title + description row, shared by the Home benefits strip and the Cart trust strip. */
function TrustStrip({ items, className }: { items: TrustStripItem[]; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 divide-y divide-border rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0",
        lgColsClass[items.length] ?? "lg:grid-cols-4",
        className
      )}
    >
      {items.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex items-start gap-4 p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
            <Icon className="size-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-body font-semibold text-foreground">{title}</h3>
            <p className="text-small text-muted-foreground">{description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export { TrustStrip }
