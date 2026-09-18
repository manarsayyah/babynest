"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Order } from "@/lib/api-client/orders"
import type { ReturnRecord, ReturnStatus } from "@/lib/api-client/returns"

const variantByStatus: Record<ReturnStatus, "warning" | "success" | "destructive" | "ai"> = {
  requested: "warning",
  approved: "ai",
  rejected: "destructive",
  completed: "success",
}

export type OrderReturnsCardProps = {
  order: Order
  /** null = still loading (or failed — see `error`). */
  returns: ReturnRecord[] | null
  error: string | null
  cancellingId: string | null
  onCancel: (returnId: string) => void
  onRetry: () => void
}

/** "Your Returns" — this order's real return requests and their backend status; renders nothing when there are none. */
function OrderReturnsCard({ order, returns, error, cancellingId, onCancel, onRetry }: OrderReturnsCardProps) {
  if (!error && returns !== null && returns.length === 0) return null

  const itemsById = new Map(order.items.map((item) => [item.orderItemId, item]))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Your Returns</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {error ? (
          <div className="flex items-center justify-between gap-3 text-small text-muted-foreground">
            {error}
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : returns === null ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          returns.map((ret) => (
            <div key={ret.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-caption text-muted-foreground">Requested {ret.requestedDate}</span>
                <Badge variant={variantByStatus[ret.status]} className="capitalize">
                  {ret.status}
                </Badge>
              </div>
              <p className="text-small text-foreground">{ret.reason}</p>
              <ul className="flex flex-col gap-0.5 text-caption text-muted-foreground">
                {ret.items.map((item) => (
                  <li key={item.orderItemId}>
                    {itemsById.get(item.orderItemId)?.product.name ?? "Item"} × {item.quantity}
                    {item.condition ? ` · ${item.condition}` : ""}
                  </li>
                ))}
              </ul>
              {ret.status === "requested" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={cancellingId === ret.id}
                  onClick={() => onCancel(ret.id)}
                >
                  {cancellingId === ret.id ? "Cancelling..." : "Cancel Request"}
                </Button>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

export { OrderReturnsCard }
