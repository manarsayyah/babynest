"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AdminOrderRow } from "@/lib/api-client/admin-orders"

export type CancelOrderDialogProps = {
  order: AdminOrderRow | null
  onClose: () => void
  /** Performs the real status update; the dialog stays open and shows a busy state until it settles. */
  onConfirm: (order: AdminOrderRow) => Promise<void>
}

/** "Are you sure you want to cancel this order?" — admin-side confirm, mirrors the storefront's cancel dialog. */
function CancelOrderDialog({ order, onClose, onConfirm }: CancelOrderDialogProps) {
  const [isCancelling, setIsCancelling] = React.useState(false)

  async function handleConfirm() {
    if (!order) return
    setIsCancelling(true)
    try {
      await onConfirm(order)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Dialog
      open={order !== null}
      onOpenChange={(open) => {
        if (!open && !isCancelling) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this order?</DialogTitle>
          <DialogDescription>
            {order
              ? `${order.orderNumber} for ${order.customer?.name ?? "this customer"} will be cancelled and the customer notified.`
              : null}{" "}
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isCancelling}>
            Keep Order
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleConfirm()}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { CancelOrderDialog }
