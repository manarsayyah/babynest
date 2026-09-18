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
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/ui/form-error"
import { RatingInput } from "@/components/product/rating-input"
import { createReview, updateReview } from "@/lib/api-client/reviews"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const MAX_COMMENT_LENGTH = 2000

export type WriteReviewTarget = {
  productId: string
  productName: string
  /** Present when editing the caller's own existing review. */
  existing?: { id: string; rating: number; comment: string }
}

export type WriteReviewDialogProps = {
  /** Product (and optionally the existing review) being written/edited, or `null` when the dialog is closed. */
  target: WriteReviewTarget | null
  onClose: () => void
  /** Called after the server accepted the review, so callers can re-read reviews. */
  onSaved: () => void
}

function ReviewForm({
  target,
  onClose,
  onSaved,
}: {
  target: WriteReviewTarget
  onClose: () => void
  onSaved: () => void
}) {
  const [rating, setRating] = React.useState(target.existing?.rating ?? 5)
  const [comment, setComment] = React.useState(target.existing?.comment ?? "")
  const [commentError, setCommentError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const isEdit = Boolean(target.existing)

  async function handleSubmit() {
    const trimmed = comment.trim()
    if (!trimmed) {
      setCommentError("Please write a few words about the product.")
      return
    }
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setCommentError(`Reviews can be at most ${MAX_COMMENT_LENGTH} characters.`)
      return
    }
    setCommentError(null)

    setIsSubmitting(true)
    try {
      if (target.existing) await updateReview(target.existing.id, { rating, comment: trimmed })
      else await createReview(target.productId, { rating, comment: trimmed })
      toast.success(isEdit ? "Review updated" : "Review submitted", {
        description: isEdit ? undefined : `Thanks for reviewing ${target.productName}! It will appear once approved.`,
      })
      onSaved()
      onClose()
    } catch (err) {
      let message = isEdit
        ? "Couldn't update your review. Please try again."
        : "Couldn't submit your review. Please try again."
      if (err instanceof ApiRequestError) {
        if (err.status === 401) message = "Please sign in to write a review."
        else if (err.status === 400) message = "Please check your rating and review and try again."
        else if (err.status === 404) message = "This product or review is no longer available."
        else if (err.status < 500) message = err.message
      }
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Your Review" : "Write a Review"}</DialogTitle>
        <DialogDescription>{target.productName}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Your rating</Label>
          <RatingInput value={rating} onChange={setRating} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="review-comment">Your review</Label>
          <Textarea
            id="review-comment"
            placeholder="Share your experience with this product..."
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              setCommentError(null)
            }}
            aria-invalid={Boolean(commentError)}
            rows={4}
          />
          <FormError message={commentError} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : isEdit ? "Save Changes" : "Submit Review"}
        </Button>
      </DialogFooter>
    </>
  )
}

/** "Write a Review" / "Edit Your Review" modal — star rating + textarea, submitted to the real Reviews API. */
function WriteReviewDialog({ target, onClose, onSaved }: WriteReviewDialogProps) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        {target ? (
          <ReviewForm
            key={`${target.productId}-${target.existing?.id ?? "new"}`}
            target={target}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { WriteReviewDialog }
