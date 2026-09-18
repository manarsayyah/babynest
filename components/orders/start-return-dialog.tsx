"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuantityStepper } from "@/components/ui/quantity-stepper"
import type { Order } from "@/lib/api-client/orders"
import { createReturn } from "@/lib/api-client/returns"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const RETURN_REASONS = [
  "Changed my mind",
  "Item arrived damaged",
  "Wrong item received",
  "Doesn't fit",
  "Other",
]

export type StartReturnDialogProps = {
  /** Only mount this component while the dialog should be open — that gives every field fresh
   * initial state for `order` without needing an effect to reset it on reopen. */
  order: Order
  onClose: () => void
  /** Called after the server has accepted the request, so the caller can re-read the order's returns. */
  onSubmitted: () => void
}

/** "Start a Return" modal — item checklist + quantity, reason, notes. Submits to POST /api/orders/[id]/returns. */
function StartReturnDialog({ order, onClose, onSubmitted }: StartReturnDialogProps) {
  // Only real OrderItem ids can be returned.
  const returnable = order.items.filter((item) => item.orderItemId)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [quantities, setQuantities] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(returnable.map((item) => [item.orderItemId as string, item.quantity]))
  )
  const [reason, setReason] = React.useState(RETURN_REASONS[0])
  const [notes, setNotes] = React.useState("")

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSubmit() {
    if (selected.size === 0) {
      toast.error("Select at least one item to return")
      return
    }
    const trimmedNotes = notes.trim()
    const fullReason = trimmedNotes ? `${reason} — ${trimmedNotes}` : reason
    if (fullReason.length > 500) {
      toast.error("Please shorten your notes")
      return
    }

    setIsSubmitting(true)
    try {
      await createReturn(order.routeId, {
        reason: fullReason,
        items: returnable
          .filter((item) => selected.has(item.orderItemId as string))
          .map((item) => ({
            orderItemId: item.orderItemId as string,
            quantity: Math.min(quantities[item.orderItemId as string] ?? 1, item.quantity),
          })),
      })
      toast.success("Return request submitted", {
        description: "We'll review your request and update its status here.",
      })
      onSubmitted()
      onClose()
    } catch (err) {
      // The backend decides eligibility (delivered order, remaining quantity) — show its safe message.
      toast.error(
        err instanceof ApiRequestError && err.status < 500
          ? err.message
          : "Couldn't submit your return request. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a Return</DialogTitle>
          <DialogDescription>
            Order {order.id} — eligible items can be returned within 30 days of delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[50vh] flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-2.5">
            {returnable.map((item) => (
              <label
                key={item.orderItemId}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-2.5"
              >
                <Checkbox
                  checked={selected.has(item.orderItemId as string)}
                  onCheckedChange={() => toggleItem(item.orderItemId as string)}
                />
                <span className="size-10 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="size-full object-cover"
                  />
                </span>
                <span className="line-clamp-1 flex-1 text-small font-medium text-foreground">
                  {item.product.name}
                </span>
                <QuantityStepper
                  size="sm"
                  value={quantities[item.orderItemId as string] ?? 1}
                  min={1}
                  max={item.quantity}
                  onChange={(next) =>
                    setQuantities((prev) => ({ ...prev, [item.orderItemId as string]: next }))
                  }
                />
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-reason">Reason for return</Label>
            <Select value={reason} onValueChange={(value) => setReason(value ?? reason)}>
              <SelectTrigger id="return-reason" className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="return-notes">Additional notes (optional)</Label>
            <Textarea
              id="return-notes"
              placeholder="Anything else we should know?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Return Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { StartReturnDialog }
