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

export type OrderStatusFilter = "all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled"
export type PaymentStatusFilter = "all" | "paid" | "pending" | "failed" | "refunded"
export type DateRangeFilter = "all" | "30" | "90" | "year"
export type OrderSortKey = "newest" | "oldest" | "amount-desc" | "amount-asc"

const orderStatusOptions: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

const paymentStatusOptions: { value: PaymentStatusFilter; label: string }[] = [
  { value: "all", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
]

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
]

const sortOptions: { value: OrderSortKey; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount-desc", label: "Highest Total" },
  { value: "amount-asc", label: "Lowest Total" },
]

export type OrdersToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  orderStatus: OrderStatusFilter
  onOrderStatusChange: (value: OrderStatusFilter) => void
  paymentStatus: PaymentStatusFilter
  onPaymentStatusChange: (value: PaymentStatusFilter) => void
  dateRange: DateRangeFilter
  onDateRangeChange: (value: DateRangeFilter) => void
  sort: OrderSortKey
  onSortChange: (value: OrderSortKey) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/** Search + order/payment status + date + sort row above the orders table. */
function OrdersToolbar({
  search,
  onSearchChange,
  orderStatus,
  onOrderStatusChange,
  paymentStatus,
  onPaymentStatusChange,
  dateRange,
  onDateRangeChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: OrdersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search by order ID or customer..."
        aria-label="Search orders"
        containerClassName="lg:max-w-xs"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={orderStatus}
          items={orderStatusOptions}
          onValueChange={(value) => onOrderStatusChange((value as OrderStatusFilter) ?? orderStatus)}
        >
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Status:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={paymentStatus}
          items={paymentStatusOptions}
          onValueChange={(value) => onPaymentStatusChange((value as PaymentStatusFilter) ?? paymentStatus)}
        >
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Payment:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {paymentStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={dateRange}
          items={dateRangeOptions}
          onValueChange={(value) => onDateRangeChange((value as DateRangeFilter) ?? dateRange)}
        >
          <SelectTrigger className="h-9 rounded-full">
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

        <Select value={sort} items={sortOptions} onValueChange={(value) => onSortChange((value as OrderSortKey) ?? sort)}>
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

export { OrdersToolbar }
