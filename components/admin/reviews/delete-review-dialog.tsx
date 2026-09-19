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
import type { AdminReviewRow } from "@/lib/api-client/admin-reviews"

export type DeleteReviewDialogProps = {
  review: AdminReviewRow | null
  onClose: () => void
  /** Performs the real (soft) delete request; the dialog stays open and shows a busy state until it settles. */
  onConfirm: (review: AdminReviewRow) => Promise<void>
}

/** "Are you sure you want to delete this review?" — mirrors the other Admin pages' confirm pattern. */
function DeleteReviewDialog({ review, onClose, onConfirm }: DeleteReviewDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleConfirm() {
    if (!review) return
    setIsDeleting(true)
    try {
      await onConfirm(review)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this review?</DialogTitle>
          <DialogDescription>
            {review
              ? `${review.customer?.name ?? "This customer"}'s review of "${review.product?.name ?? "this product"}" will be removed and no longer count toward the product's rating.`
              : null}{" "}
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Keep Review
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteReviewDialog }
