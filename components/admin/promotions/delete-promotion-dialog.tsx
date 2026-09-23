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
import type { AdminPromotionRow } from "@/lib/api-client/admin-promotions"

export type DeletePromotionDialogProps = {
  promotion: AdminPromotionRow | null
  onClose: () => void
  /** Performs the real (soft) delete request; the dialog stays open and shows a busy state until it settles. */
  onConfirm: (promotion: AdminPromotionRow) => Promise<void>
}

/** "Are you sure you want to delete this promotion?" — mirrors DeleteProductDialog. */
function DeletePromotionDialog({ promotion, onClose, onConfirm }: DeletePromotionDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleConfirm() {
    if (!promotion) return
    setIsDeleting(true)
    try {
      await onConfirm(promotion)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={promotion !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this promotion?</DialogTitle>
          <DialogDescription>
            {promotion ? `"${promotion.code}" will stop working at checkout.` : null} Customers will no longer be
            able to apply this code.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Keep Promotion
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Promotion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeletePromotionDialog }
