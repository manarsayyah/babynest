"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { returnStatusLabel, type ReturnStatus } from "@/lib/api-client/admin-returns"

export type ReturnStatusFilter = "all" | ReturnStatus

const statusOptions: { value: ReturnStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  ...(Object.keys(returnStatusLabel) as ReturnStatus[]).map((value) => ({ value, label: returnStatusLabel[value] })),
]

export type ReturnsToolbarProps = {
  status: ReturnStatusFilter
  onStatusChange: (value: ReturnStatusFilter) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/**
 * Status filter above the returns table. The admin returns API only supports filtering by `status` (and
 * `orderId`, not useful as free text here) — there's no search-by-code equivalent to reuse, so this toolbar
 * is deliberately narrower than ProductsToolbar/PromotionsToolbar.
 */
function ReturnsToolbar({ status, onStatusChange, hasActiveFilters, onClearFilters }: ReturnsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} items={statusOptions} onValueChange={(value) => onStatusChange((value as ReturnStatusFilter) ?? status)}>
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
  )
}

export { ReturnsToolbar }
