"use client"

import * as React from "react"
import { toast } from "sonner"
import { MessageSquareText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
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
import { adminReviews, type AdminReview } from "@/lib/mock/admin-reviews"

const PAGE_SIZE = 8

/** Admin Reviews page: header, summary tiles, toolbar, table/cards, pagination, detail + delete dialogs. */
function AdminReviewsPageContent() {
  const [reviews, setReviews] = React.useState<AdminReview[]>(adminReviews)
  const [search, setSearch] = React.useState("")
  const [rating, setRating] = React.useState<RatingFilter>("all")
  const [status, setStatus] = React.useState<ReviewStatusFilter>("all")
  const [product, setProduct] = React.useState("all")
  const [sort, setSort] = React.useState<ReviewSortKey>("newest")
  const [page, setPage] = React.useState(1)
  const [reviewToView, setReviewToView] = React.useState<AdminReview | null>(null)
  const [reviewToDelete, setReviewToDelete] = React.useState<AdminReview | null>(null)

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
    setRating("all")
    setStatus("all")
    setProduct("all")
    setPage(1)
  }

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = reviews.filter((review) => {
      if (rating !== "all" && review.rating !== Number(rating)) return false
      if (status !== "all" && review.status !== status) return false
      if (product !== "all" && review.productSlug !== product) return false
      if (
        query &&
        !review.customerName.toLowerCase().includes(query) &&
        !review.productName.toLowerCase().includes(query) &&
        !review.comment.toLowerCase().includes(query)
      ) {
        return false
      }
      return true
    })

    const sorted = [...result]
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "rating-desc":
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case "rating-asc":
        sorted.sort((a, b) => a.rating - b.rating)
        break
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
    }
    return sorted
  }, [reviews, search, rating, status, product, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(filtered.length, currentPage * PAGE_SIZE)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handlePublish(review: AdminReview) {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: "published" } : r)))
    setReviewToView(null)
    toast.success("Review published", { description: `${review.customerName}'s review is now live.` })
  }

  function handleHide(review: AdminReview) {
    setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status: "hidden" } : r)))
    setReviewToView(null)
    toast.success("Review hidden", { description: `${review.customerName}'s review is no longer visible.` })
  }

  function handleRequestDelete(review: AdminReview) {
    setReviewToView(null)
    setReviewToDelete(review)
  }

  function handleDeleteConfirm(reviewId: string) {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId))
    setReviewToDelete(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Reviews</h1>
        <p className="text-body text-muted-foreground">Manage customer reviews and product feedback</p>
      </div>

      <ReviewsSummaryCards reviews={reviews} />

      <Card className="p-5">
        <ReviewsToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          rating={rating}
          onRatingChange={resetToFirstPage(setRating)}
          status={status}
          onStatusChange={resetToFirstPage(setStatus)}
          product={product}
          onProductChange={resetToFirstPage(setProduct)}
          sort={sort}
          onSortChange={setSort}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {paged.length > 0 ? (
        <Card className="p-0">
          <div className="p-5">
            <ReviewsTable
              reviews={paged}
              onView={setReviewToView}
              onPublish={handlePublish}
              onHide={handleHide}
              onDelete={setReviewToDelete}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
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
        onPublish={handlePublish}
        onHide={handleHide}
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
