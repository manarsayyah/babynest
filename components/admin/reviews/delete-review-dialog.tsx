"use client"

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
import type { AdminReview } from "@/lib/mock/admin-reviews"

export type DeleteReviewDialogProps = {
  review: AdminReview | null
  onClose: () => void
  onConfirm: (reviewId: string) => void
}

/** "Are you sure you want to delete this review?" — mirrors the other Admin pages' confirm pattern. */
function DeleteReviewDialog({ review, onClose, onConfirm }: DeleteReviewDialogProps) {
  return (
    <Dialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this review?</DialogTitle>
          <DialogDescription>
            {review ? `${review.customerName}'s review of "${review.productName}" will be removed.` : null} This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Keep Review
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (!review) return
              onConfirm(review.id)
              toast.success("Review deleted", { description: `${review.customerName}'s review has been removed.` })
            }}
          >
            Delete Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteReviewDialog }
