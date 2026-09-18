"use client"

import { Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Rating } from "@/components/product/rating"
import { formatReviewDate, reviewStatusLabel, type AdminReview, type ReviewStatus } from "@/lib/mock/admin-reviews"

const statusBadgeVariant: Record<ReviewStatus, "success" | "warning" | "outline"> = {
  published: "success",
  pending: "warning",
  hidden: "outline",
}

export type ReviewDetailDialogProps = {
  review: AdminReview | null
  onClose: () => void
  onPublish: (review: AdminReview) => void
  onHide: (review: AdminReview) => void
  onRequestDelete: (review: AdminReview) => void
}

/** Full review view — customer, product, rating, complete text — with Publish/Hide/Delete actions. */
function ReviewDetailDialog({ review, onClose, onPublish, onHide, onRequestDelete }: ReviewDetailDialogProps) {
  return (
    <Dialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {review ? (
          <>
            <DialogHeader>
              <DialogTitle>Review from {review.customerName}</DialogTitle>
              <DialogDescription>{review.customerEmail}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.productImage}
                  alt={review.productName}
                  className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                />
                <div className="min-w-0">
                  <p className="truncate text-small font-medium text-foreground">{review.productName}</p>
                  <p className="text-caption text-muted-foreground">{formatReviewDate(review.date)}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Rating value={review.rating} size="md" />
                <Badge variant={statusBadgeVariant[review.status]}>{reviewStatusLabel[review.status]}</Badge>
              </div>

              <p className="text-small text-foreground">&ldquo;{review.comment}&rdquo;</p>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onRequestDelete(review)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
                {review.status === "published" ? (
                  <Button variant="outline" onClick={() => onHide(review)}>
                    Hide Review
                  </Button>
                ) : (
                  <Button onClick={() => onPublish(review)}>
                    {review.status === "pending" ? "Approve & Publish" : "Publish Review"}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { ReviewDetailDialog }
