"use client"

import { cn } from "cn"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OrderStatus } from "@/lib/api-client/orders"

export type StatusFilter = "all" | OrderStatus
export type DateRangeFilter = "all" | "30" | "90" | "year"
export type SortKey = "newest" | "oldest" | "amount-desc" | "amount-asc"

const statusTabs: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
]

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
]

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount-desc", label: "Highest Amount" },
  { value: "amount-asc", label: "Lowest Amount" },
]

export type OrdersToolbarProps = {
  counts: Record<StatusFilter, number>
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
  search: string
  onSearchChange: (value: string) => void
  dateRange: DateRangeFilter
  onDateRangeChange: (value: DateRangeFilter) => void
  sort: SortKey
  onSortChange: (value: SortKey) => void
}

/** Status filter tabs + search/date-range/sort control row above the order list. */
function OrdersToolbar({
  counts,
  status,
  onStatusChange,
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  sort,
  onSortChange,
}: OrdersToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const isActive = status === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusChange(tab.key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-small font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-caption",
                  isActive ? "bg-primary-foreground/20" : "bg-muted"
                )}
              >
                {counts[tab.key]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange("")}
          placeholder="Search orders by order # or product name..."
          aria-label="Search orders"
          containerClassName="flex-1"
        />

        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(value) => onDateRangeChange((value as DateRangeFilter) ?? dateRange)}>
            <SelectTrigger className="h-11 rounded-full">
              <span className="text-muted-foreground">Date:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => onSortChange((value as SortKey) ?? sort)}>
            <SelectTrigger className="h-11 rounded-full">
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
        </div>
      </div>
    </div>
  )
}

export { OrdersToolbar }
