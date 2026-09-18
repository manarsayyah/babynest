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

export type CategoryStatusFilter = "all" | "active" | "inactive"
export type CategorySortKey = "name-asc" | "products-desc" | "products-asc" | "newest"

const statusOptions: { value: CategoryStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

const sortOptions: { value: CategorySortKey; label: string }[] = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "products-desc", label: "Most Products" },
  { value: "products-asc", label: "Fewest Products" },
  { value: "newest", label: "Recently Created" },
]

export type CategoriesToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  status: CategoryStatusFilter
  onStatusChange: (value: CategoryStatusFilter) => void
  sort: CategorySortKey
  onSortChange: (value: CategorySortKey) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/** Search + status filter + sort row above the categories grid. */
function CategoriesToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: CategoriesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search categories..."
        aria-label="Search categories"
        containerClassName="lg:max-w-xs"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select value={status} onValueChange={(value) => onStatusChange((value as CategoryStatusFilter) ?? status)}>
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

        <Select value={sort} onValueChange={(value) => onSortChange((value as CategorySortKey) ?? sort)}>
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

export { CategoriesToolbar }
