"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { reviewProductOptions } from "@/lib/mock/admin-reviews"

export type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1"
export type ReviewStatusFilter = "all" | "published" | "pending" | "hidden"
export type ReviewSortKey = "newest" | "oldest" | "rating-desc" | "rating-asc"

const ratingOptions: { value: RatingFilter; label: string }[] = [
  { value: "all", label: "All Ratings" },
  { value: "5", label: "5 Stars" },
  { value: "4", label: "4 Stars" },
  { value: "3", label: "3 Stars" },
  { value: "2", label: "2 Stars" },
  { value: "1", label: "1 Star" },
]

const statusOptions: { value: ReviewStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "published", label: "Published" },
  { value: "pending", label: "Pending" },
  { value: "hidden", label: "Hidden" },
]

const sortOptions: { value: ReviewSortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "rating-asc", label: "Lowest Rated" },
]

export type ReviewsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  rating: RatingFilter
  onRatingChange: (value: RatingFilter) => void
  status: ReviewStatusFilter
  onStatusChange: (value: ReviewStatusFilter) => void
  product: string
  onProductChange: (value: string) => void
  sort: ReviewSortKey
  onSortChange: (value: ReviewSortKey) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/** Search + rating/status/product filters + sort row above the reviews table. */
function ReviewsToolbar({
  search,
  onSearchChange,
  rating,
  onRatingChange,
  status,
  onStatusChange,
  product,
  onProductChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: ReviewsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search reviews..."
        aria-label="Search reviews"
        containerClassName="lg:max-w-xs"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select value={rating} onValueChange={(value) => onRatingChange((value as RatingFilter) ?? rating)}>
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Rating:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ratingOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(value) => onStatusChange((value as ReviewStatusFilter) ?? status)}>
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Status:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={product} onValueChange={(value) => onProductChange(value ?? product)}>
          <SelectTrigger className="h-9 max-w-48 rounded-full">
            <span className="text-muted-foreground">Product:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {reviewProductOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => onSortChange((value as ReviewSortKey) ?? sort)}>
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Sort:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X data-icon="inline-start" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export { ReviewsToolbar }
