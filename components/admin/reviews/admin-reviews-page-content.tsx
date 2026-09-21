"use client"

import * as React from "react"
import { toast } from "sonner"
import { MessageSquareText, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ReviewsSummaryCards } from "@/components/admin/reviews/reviews-summary-cards"
import {
  ReviewsToolbar,
  type RatingFilter,
  type ReviewSortKey,
  type ReviewStatusFilter,
} from "@/components/admin/reviews/reviews-toolbar"
import { ReviewsTable } from "@/components/admin/reviews/reviews-table"
import { ReviewDetailDialog } from "@/components/admin/reviews/review-detail-dialog"
import { DeleteReviewDialog } from "@/components/admin/reviews/delete-review-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import {
  deleteAdminReview,
  fetchAdminReviews,
  updateAdminReviewStatus,
  type AdminReviewListResponse,
  type AdminReviewQuery,
  type AdminReviewRow,
} from "@/lib/api-client/admin-reviews"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const PAGE_SIZE = 8
const SEARCH_DEBOUNCE_MS = 300

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to moderate reviews."
    if (err.status === 404) return "This review no longer exists."
    if (err.status < 500) return err.message
  }
  return fallback
}

function reviewerName(review: AdminReviewRow) {
  return review.customer?.name ?? "This customer"
}

/** Admin Reviews page: header, summary tiles, toolbar, table/cards, pagination, detail + delete dialogs — all backed by the real Reviews API. */
function AdminReviewsPageContent() {
  const [data, setData] = React.useState<AdminReviewListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [rating, setRating] = React.useState<RatingFilter>("all")
  const [status, setStatus] = React.useState<ReviewStatusFilter>("all")
  const [product, setProduct] = React.useState("all")
  const [sort, setSort] = React.useState<ReviewSortKey>("newest")
  const [page, setPage] = React.useState(1)

  const [reviewToView, setReviewToView] = React.useState<AdminReviewRow | null>(null)
  const [reviewToDelete, setReviewToDelete] = React.useState<AdminReviewRow | null>(null)
  const [busyReviewId, setBusyReviewId] = React.useState<string | null>(null)

  const hasActiveFilters =
    search.trim().length > 0 || rating !== "all" || status !== "all" || product !== "all"

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  function handleClearFilters() {
    setSearch("")
    setDebouncedSearch("")
    setRating("all")
    setStatus("all")
    setProduct("all")
    setPage(1)
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const query = React.useMemo<AdminReviewQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status: status === "all" ? undefined : status,
      productId: product === "all" ? undefined : product,
      rating: rating === "all" ? undefined : Number(rating),
      sort,
    }),
    [page, debouncedSearch, status, product, rating, sort]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminReviews(query, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setLoadError(null)
        setSettledKey(key)
        // The last row of the last page was removed — step back to a page that exists.
        if (result.items.length === 0 && result.total > 0 && (query.page ?? 1) > result.totalPages) {
          setPage(result.totalPages)
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
        setSettledKey(key)
      })

    return () => controller.abort()
  }, [query, reloadToken])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, (currentPage - 1) * PAGE_SIZE + items.length)

  const productOptions = React.useMemo(
    () => (data?.productOptions ?? []).map((option) => ({ value: option._id, label: option.name })),
    [data?.productOptions]
  )

  /** Publish/hide from the table (busy-tracked per row) or from the detail dialog (which has its own busy state). */
  async function setStatusFor(review: AdminReviewRow, next: "published" | "hidden", fromDialog: boolean) {
    if (!fromDialog) setBusyReviewId(review._id)
    try {
      await updateAdminReviewStatus(review._id, next)
      toast.success(next === "published" ? "Review published" : "Review hidden", {
        description:
          next === "published"
            ? `${reviewerName(review)}'s review is now live.`
            : `${reviewerName(review)}'s review is no longer visible.`,
      })
      if (fromDialog) setReviewToView(null)
    } catch (err) {
      toast.error(
        errorMessage(err, next === "published" ? "Couldn't publish the review. Please try again." : "Couldn't hide the review. Please try again.")
      )
    } finally {
      if (!fromDialog) setBusyReviewId(null)
      reload()
    }
  }

  function handleRequestDelete(review: AdminReviewRow) {
    setReviewToView(null)
    setReviewToDelete(review)
  }

  async function handleDeleteConfirm(review: AdminReviewRow) {
    try {
      await deleteAdminReview(review._id)
      toast.success("Review deleted", { description: `${reviewerName(review)}'s review has been removed.` })
      setReviewToDelete(null)
    } catch (err) {
      // A 404 means it's already gone — close the dialog and let the refresh show that.
      if (err instanceof ApiRequestError && err.status === 404) setReviewToDelete(null)
      toast.error(errorMessage(err, "Couldn't delete the review. Please try again."))
    }
    reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-admin-title text-foreground">Reviews</h1>
        <p className="text-body text-muted-foreground">Manage customer reviews and product feedback</p>
      </div>

      <ReviewsSummaryCards summary={data?.summary ?? null} />

      <Card className="p-5">
        <ReviewsToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          rating={rating}
          onRatingChange={resetToFirstPage(setRating)}
          status={status}
          onStatusChange={resetToFirstPage(setStatus)}
          product={product}
          productOptions={productOptions}
          onProductChange={resetToFirstPage(setProduct)}
          sort={sort}
          onSortChange={resetToFirstPage(setSort)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load reviews"
          description={loadError}
          action={
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : data === null ? (
        <Card className="p-5">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      ) : items.length > 0 ? (
        <Card className="p-0">
          <div className={isFetching ? "p-5 opacity-60 transition-opacity" : "p-5 transition-opacity"} aria-busy={isFetching}>
            <ReviewsTable
              reviews={items}
              onView={setReviewToView}
              onPublish={(review) => void setStatusFor(review, "published", false)}
              onHide={(review) => void setStatusFor(review, "hidden", false)}
              onDelete={setReviewToDelete}
              busyReviewId={busyReviewId}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} {total === 1 ? "review" : "reviews"}
            </p>
            <ProductsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Customer reviews will show up here once they're submitted."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      <ReviewDetailDialog
        review={reviewToView}
        onClose={() => setReviewToView(null)}
        onPublish={(review) => setStatusFor(review, "published", true)}
        onHide={(review) => setStatusFor(review, "hidden", true)}
        onRequestDelete={handleRequestDelete}
      />

      <DeleteReviewDialog
        review={reviewToDelete}
        onClose={() => setReviewToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export { AdminReviewsPageContent }
