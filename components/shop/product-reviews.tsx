"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Check, Pencil, Trash2, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Rating } from "@/components/product/rating"
import { WriteReviewDialog, type WriteReviewTarget } from "@/components/orders/write-review-dialog"
import { formatOrderDate } from "@/lib/api-client/orders"
import {
  deleteReview,
  fetchProductReviews,
  reviewerName,
  type ApiReview,
  type MyReview,
  type ReviewStatus,
} from "@/lib/api-client/reviews"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const PAGE_SIZE = 10

const statusNote: Record<ReviewStatus, string> = {
  pending: "Pending approval — only you can see this until it's approved.",
  published: "Published",
  hidden: "Hidden by our team",
}

function ReviewCard({ review }: { review: ApiReview }) {
  return (
    <li className="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="text-small font-semibold text-foreground">{reviewerName(review.reviewer)}</span>
          {review.isVerifiedPurchase ? (
            <Badge variant="success">
              <Check className="size-3" />
              Verified Purchase
            </Badge>
          ) : null}
        </span>
        <span className="text-caption text-muted-foreground">{formatOrderDate(review.createdAt)}</span>
      </div>
      <Rating value={review.rating} size="sm" />
      <p className="text-small text-muted-foreground">{review.comment}</p>
    </li>
  )
}

/** Real product reviews (public), the caller's own review (edit/delete), and the entry point for writing one. */
function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [reviews, setReviews] = React.useState<ApiReview[] | null>(null)
  const [myReview, setMyReview] = React.useState<MyReview | null>(null)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [writeTarget, setWriteTarget] = React.useState<WriteReviewTarget | null>(null)
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Wait for the session to resolve so the server can return `myReview` for a signed-in caller on the first read.
  const sessionReady = status !== "loading"

  React.useEffect(() => {
    if (!sessionReady) return
    let cancelled = false

    async function load() {
      try {
        const result = await fetchProductReviews(productId, 1, PAGE_SIZE)
        if (cancelled) return
        setReviews(result.items)
        setMyReview(result.myReview)
        setPage(1)
        setTotalPages(result.totalPages)
        setError(null)
      } catch {
        if (cancelled) return
        setReviews(null)
        setError("Couldn't load reviews right now.")
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [productId, sessionReady, status, reloadToken])

  async function handleLoadMore() {
    setIsLoadingMore(true)
    try {
      const next = await fetchProductReviews(productId, page + 1, PAGE_SIZE)
      setReviews((prev) => [...(prev ?? []), ...next.items])
      setPage(next.page)
      setTotalPages(next.totalPages)
    } catch {
      toast.error("Couldn't load more reviews. Please try again.")
    } finally {
      setIsLoadingMore(false)
    }
  }

  function refreshAll() {
    setReloadToken((n) => n + 1)
    // The product's average rating / review count are rendered by the server — re-read them too.
    router.refresh()
  }

  function handleWrite() {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`)
      return
    }
    setWriteTarget({ productId, productName })
  }

  async function handleDelete() {
    if (!myReview) return
    setIsDeleting(true)
    try {
      await deleteReview(myReview.id)
      toast.success("Review deleted")
      setConfirmDelete(false)
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 404) setConfirmDelete(false)
      toast.error(
        err instanceof ApiRequestError && err.status < 500 && err.status !== 404
          ? err.message
          : "Couldn't delete your review. Please try again."
      )
    } finally {
      setIsDeleting(false)
      refreshAll()
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {!myReview ? (
        <div>
          <Button variant="secondary" onClick={handleWrite}>
            Write a Review
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-small font-semibold text-foreground">Your review</span>
            <Badge variant={myReview.status === "published" ? "success" : "warning"} className="capitalize">
              {myReview.status}
            </Badge>
          </div>
          <Rating value={myReview.rating} size="sm" />
          <p className="text-small text-muted-foreground">{myReview.comment}</p>
          <p className="text-caption text-muted-foreground">{statusNote[myReview.status]}</p>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setWriteTarget({
                  productId,
                  productName,
                  existing: { id: myReview.id, rating: myReview.rating, comment: myReview.comment },
                })
              }
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load reviews"
          description={error}
          action={
            <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
              Try again
            </Button>
          }
        />
      ) : reviews === null ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-small text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-border">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
          {page < totalPages ? (
            <Button variant="outline" className="w-fit" onClick={() => void handleLoadMore()} disabled={isLoadingMore}>
              {isLoadingMore ? "Loading..." : "Show more reviews"}
            </Button>
          ) : null}
        </>
      )}

      <WriteReviewDialog target={writeTarget} onClose={() => setWriteTarget(null)} onSaved={refreshAll} />

      <Dialog open={confirmDelete} onOpenChange={(open) => (!open && !isDeleting ? setConfirmDelete(false) : undefined)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete your review?</DialogTitle>
            <DialogDescription>Your review of {productName} will be removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
              Keep Review
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { ProductReviews }
