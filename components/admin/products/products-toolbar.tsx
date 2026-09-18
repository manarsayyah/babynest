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
import type { AdminProductStatus } from "@/lib/admin-product-status"

export type StockStatusFilter = "all" | "healthy" | "low" | "out"
export type ProductStatusFilter = "all" | AdminProductStatus
export type ProductSortKey = "name-asc" | "price-asc" | "price-desc" | "stock-asc" | "rating-desc"

const stockStatusOptions: { value: StockStatusFilter; label: string }[] = [
  { value: "all", label: "All Stock" },
  { value: "healthy", label: "Healthy" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
]

const productStatusOptions: { value: ProductStatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "out-of-stock", label: "Out of Stock" },
]

const sortOptions: { value: ProductSortKey; label: string }[] = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "stock-asc", label: "Stock: Low to High" },
  { value: "rating-desc", label: "Highest Rated" },
]

export type ProductsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  /** Real categories from GET /api/categories (value = category id). */
  categoryOptions: { value: string; label: string }[]
  stockStatus: StockStatusFilter
  onStockStatusChange: (value: StockStatusFilter) => void
  productStatus: ProductStatusFilter
  onProductStatusChange: (value: ProductStatusFilter) => void
  sort: ProductSortKey
  onSortChange: (value: ProductSortKey) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/** Search + category/stock/status filters + sort row above the products table. */
function ProductsToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  stockStatus,
  onStockStatusChange,
  productStatus,
  onProductStatusChange,
  sort,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: ProductsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange("")}
        placeholder="Search products..."
        aria-label="Search products"
        containerClassName="lg:max-w-xs"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Select
          value={category}
          items={[{ value: "all", label: "All Categories" }, ...categoryOptions]}
          onValueChange={(value) => onCategoryChange(value ?? category)}
        >
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Category:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={stockStatus}
          items={stockStatusOptions}
          onValueChange={(value) => onStockStatusChange((value as StockStatusFilter) ?? stockStatus)}
        >
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Stock:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stockStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={productStatus}
          items={productStatusOptions}
          onValueChange={(value) => onProductStatusChange((value as ProductStatusFilter) ?? productStatus)}
        >
          <SelectTrigger className="h-9 rounded-full">
            <span className="text-muted-foreground">Status:</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {productStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} items={sortOptions} onValueChange={(value) => onSortChange((value as ProductSortKey) ?? sort)}>
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

export { ProductsToolbar }
