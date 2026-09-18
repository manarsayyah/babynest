"use client"

import { Ban, CheckCircle2, Eye, MoreVertical, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Rating } from "@/components/product/rating"
import {
  formatReviewDate,
  reviewStatusLabel,
  type AdminReview,
  type ReviewStatus,
} from "@/lib/mock/admin-reviews"

const statusBadgeVariant: Record<ReviewStatus, "success" | "warning" | "outline"> = {
  published: "success",
  pending: "warning",
  hidden: "outline",
}

export type ReviewsTableProps = {
  reviews: AdminReview[]
  onView: (review: AdminReview) => void
  onPublish: (review: AdminReview) => void
  onHide: (review: AdminReview) => void
  onDelete: (review: AdminReview) => void
}

function ActionsMenu({ review, onView, onPublish, onHide, onDelete }: {
  review: AdminReview
  onView: (review: AdminReview) => void
  onPublish: (review: AdminReview) => void
  onHide: (review: AdminReview) => void
  onDelete: (review: AdminReview) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${review.customerName}'s review`}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(review)}>
          <Eye className="size-4" />
          View Review
        </DropdownMenuItem>
        {review.status === "published" ? (
          <DropdownMenuItem onClick={() => onHide(review)}>
            <Ban className="size-4" />
            Hide
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onPublish(review)}>
            <CheckCircle2 className="size-4" />
            {review.status === "pending" ? "Approve / Publish" : "Publish"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(review)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Reviews table — full table on desktop, stacked cards below `md` so nothing breaks on mobile. */
function ReviewsTable({ reviews, onView, onPublish, onHide, onDelete }: ReviewsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 text-left">Customer</th>
              <th className="px-3 py-2.5 text-left">Product</th>
              <th className="px-3 py-2.5 text-left">Rating</th>
              <th className="px-3 py-2.5 text-left">Review</th>
              <th className="px-3 py-2.5 text-left">Date</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.customerAvatar}
                      alt={review.customerName}
                      className="size-8 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
                    />
                    <span className="font-medium text-foreground">{review.customerName}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.productImage}
                      alt={review.productName}
                      className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                    />
                    <span className="max-w-40 truncate text-foreground">{review.productName}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <Rating value={review.rating} size="sm" />
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onView(review)}
                    className="line-clamp-2 max-w-64 text-left text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    &ldquo;{review.comment}&rdquo;
                  </button>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatReviewDate(review.date)}</td>
                <td className="px-3 py-3">
                  <Badge variant={statusBadgeVariant[review.status]}>{reviewStatusLabel[review.status]}</Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  <ActionsMenu review={review} onView={onView} onPublish={onPublish} onHide={onHide} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.customerAvatar}
                alt={review.customerName}
                className="size-10 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-foreground">{review.customerName}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <Rating value={review.rating} size="sm" />
                  <Badge variant={statusBadgeVariant[review.status]}>{reviewStatusLabel[review.status]}</Badge>
                </div>
              </div>
              <ActionsMenu review={review} onView={onView} onPublish={onPublish} onHide={onHide} onDelete={onDelete} />
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-muted/50 p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.productImage}
                alt={review.productName}
                className="size-9 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
              />
              <span className="truncate text-small text-foreground">{review.productName}</span>
            </div>

            <button
              type="button"
              onClick={() => onView(review)}
              className="mt-2.5 line-clamp-2 text-left text-small text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:underline"
            >
              &ldquo;{review.comment}&rdquo;
            </button>

            <p className="mt-2 text-caption text-muted-foreground">{formatReviewDate(review.date)}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export { ReviewsTable }
