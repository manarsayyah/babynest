"use client"

import * as React from "react"
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
import {
  formatReviewDate,
  reviewProductImage,
  reviewStatusLabel,
  type AdminReviewRow,
  type ReviewStatus,
} from "@/lib/api-client/admin-reviews"

const statusBadgeVariant: Record<ReviewStatus, "success" | "warning" | "outline"> = {
  published: "success",
  pending: "warning",
  hidden: "outline",
}

export type ReviewDetailDialogProps = {
  review: AdminReviewRow | null
  onClose: () => void
  /** Each moderation action performs the real request; the dialog shows a busy state until it settles. */
  onPublish: (review: AdminReviewRow) => Promise<void>
  onHide: (review: AdminReviewRow) => Promise<void>
  onRequestDelete: (review: AdminReviewRow) => void
}

/** Full review view — customer, product, rating, complete text — with Publish/Hide/Delete actions. */
function ReviewDetailDialog({ review, onClose, onPublish, onHide, onRequestDelete }: ReviewDetailDialogProps) {
  const [working, setWorking] = React.useState<"publish" | "hide" | null>(null)

  async function run(action: "publish" | "hide", handler: (review: AdminReviewRow) => Promise<void>) {
    if (!review) return
    setWorking(action)
    try {
      await handler(review)
    } finally {
      setWorking(null)
    }
  }

  return (
    <Dialog
      open={review !== null}
      onOpenChange={(open) => {
        if (!open && !working) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {review ? (
          <>
            <DialogHeader>
              <DialogTitle>Review from {review.customer?.name ?? "Unknown customer"}</DialogTitle>
              <DialogDescription>{review.customer?.email ?? "This account no longer exists."}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={reviewProductImage(review)}
                  alt={review.product?.name ?? "Unavailable product"}
                  className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                />
                <div className="min-w-0">
                  <p className="truncate text-small font-medium text-foreground">
                    {review.product?.name ?? "Unavailable product"}
                  </p>
                  <p className="text-caption text-muted-foreground">{formatReviewDate(review.createdAt)}</p>
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
                disabled={working !== null}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="secondary" onClick={onClose} disabled={working !== null}>
                  Close
                </Button>
                {review.status === "published" ? (
                  <Button variant="outline" onClick={() => void run("hide", onHide)} disabled={working !== null}>
                    {working === "hide" ? "Hiding..." : "Hide Review"}
                  </Button>
                ) : (
                  <Button onClick={() => void run("publish", onPublish)} disabled={working !== null}>
                    {working === "publish"
                      ? "Publishing..."
                      : review.status === "pending"
                        ? "Approve & Publish"
                        : "Publish Review"}
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
