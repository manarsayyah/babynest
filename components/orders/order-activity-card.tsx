"use client"

import * as React from "react"
import { CheckCircle2, ChevronDown } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Order } from "@/lib/api-client/orders"

/** "Order Activity" — a collapsible timeline derived from the order's confirmed/shipped/delivered dates. */
function OrderActivityCard({ order }: { order: Order }) {
  const [isOpen, setIsOpen] = React.useState(true)
  // Real OrderStatusHistory rows, newest first.
  const entries = order.activity

  if (entries.length === 0) return null

  return (
    <Card>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between"
        onClick={() => setIsOpen((open) => !open)}
      >
        <CardTitle className="text-h3">Order Activity</CardTitle>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
        />
      </CardHeader>
      {isOpen ? (
        <CardContent>
          <ul className="flex flex-col">
            {entries.map((entry, index) => (
              <li key={`${entry.date}-${entry.title}`} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <CheckCircle2 className="size-4" />
                  </span>
                  {index < entries.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
                </span>
                <div className="flex flex-col gap-0.5 pb-4 last:pb-0">
                  <span className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
                    {entry.date}
                  </span>
                  <span className="text-small text-foreground">{entry.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  )
}

export { OrderActivityCard }
