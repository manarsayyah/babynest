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

export type PromotionStatusFilter = "all" | "active" | "inactive"

const statusOptions: { value: PromotionStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

export type PromotionsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  status: PromotionStatusFilter
  onStatusChange: (value: PromotionStatusFilter) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/** Search-by-code + active/inactive filter row above the promotions table (mirrors ProductsToolbar). */
function PromotionsToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  hasActiveFilters,
  onClearFilters,
}: PromotionsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search by code..."
        aria-label="Search promotions by code"
        containerClassName="lg:max-w-xs"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={status}
          items={statusOptions}
          onValueChange={(value) => onStatusChange((value as PromotionStatusFilter) ?? status)}
        >
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

export { PromotionsToolbar }
