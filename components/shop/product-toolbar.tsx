"use client"

import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest"

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "newest", label: "Newest" },
]

export type ProductToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  sort: SortKey
  onSortChange: (value: SortKey) => void
  resultCount: number
}

/** Search + sort row above the product grid. */
function ProductToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  resultCount,
}: ProductToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          placeholder="Search products..."
          aria-label="Search products"
          containerClassName="flex-1"
        />
        <Select value={sort} onValueChange={(value) => onSortChange(value as SortKey)}>
          <SelectTrigger className="h-11 w-full rounded-full sm:w-56">
            <span className="text-muted-foreground">Sort by:</span>
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
      </div>
      <p className="text-small text-muted-foreground">
        {resultCount} {resultCount === 1 ? "product" : "products"} found
      </p>
    </div>
  )
}

export { ProductToolbar }
