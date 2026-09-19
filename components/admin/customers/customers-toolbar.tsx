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

export type CustomerStatusFilter = "all" | "active" | "inactive"
export type RegistrationDateFilter = "all" | "30" | "90" | "year"
export type CustomerSortKey = "newest" | "oldest" | "orders-desc" | "spent-desc" | "name-asc"

const statusOptions: { value: CustomerStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

const registrationDateOptions: { value: RegistrationDateFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year" },
]

const sortOptions: { value: CustomerSortKey; label: string }[] = [
  { value: "newest", label: "Recently Joined" },
  { value: "oldest", label: "Oldest Accounts" },
  { value: "orders-desc", label: "Most Orders" },
  { value: "spent-desc", label: "Highest Spend" },
  { value: "name-asc", label: "Name: A to Z" },
]

export type CustomersToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  status: CustomerStatusFilter
  onStatusChange: (value: CustomerStatusFilter) => void
  registrationDate: RegistrationDateFilter
  onRegistrationDateChange: (value: RegistrationDateFilter) => void
  sort: CustomerSortKey
  onSortChange: (value: CustomerSortKey) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/** Search + status/registration-date filters + sort row above the customers table. */
function CustomersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  registrationDate,
  onRegistrationDateChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: CustomersToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search customers..."
        aria-label="Search customers"
        containerClassName="lg:max-w-xs"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select value={status} items={statusOptions} onValueChange={(value) => onStatusChange((value as CustomerStatusFilter) ?? status)}>
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

        <Select
          value={registrationDate}
          items={registrationDateOptions}
          onValueChange={(value) => onRegistrationDateChange((value as RegistrationDateFilter) ?? registrationDate)}
        >
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Joined:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {registrationDateOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} items={sortOptions} onValueChange={(value) => onSortChange((value as CustomerSortKey) ?? sort)}>
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

export { CustomersToolbar }
