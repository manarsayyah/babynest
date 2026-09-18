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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Delivery taking too long",
  "Other",
]

export type CancelOrderDialogProps = {
  orderId: string | null
  onClose: () => void
  onConfirm: (orderId: string, reason: string) => void
}

/** "Are you sure you want to cancel this order?" — reason select + Keep/Cancel. Frontend-only. */
function CancelOrderDialog({ orderId, onClose, onConfirm }: CancelOrderDialogProps) {
  const [reason, setReason] = React.useState(CANCEL_REASONS[0])

  return (
    <Dialog
      open={orderId !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Are you sure you want to cancel this order?</DialogTitle>
          <DialogDescription>
            {orderId ? `Order ${orderId} will be cancelled and your payment refunded.` : null} This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">Reason for cancelling</Label>
          <Select value={reason} onValueChange={(value) => setReason(value ?? reason)}>
            <SelectTrigger id="cancel-reason" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANCEL_REASONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Keep Order
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (!orderId) return
              onConfirm(orderId, reason)
              toast.success("Order cancelled", { description: `${orderId} has been cancelled.` })
            }}
          >
            Cancel Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CancelOrderDialog }
