"use client"

import { Eye, EyeOff, MoreVertical, Pencil, Power, Trash2 } from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Rating } from "@/components/product/rating"
import { formatPrice } from "@/lib/format"
import { LOW_STOCK_THRESHOLD, type AdminProductStatus } from "@/lib/admin-product-status"
import type { AdminProductRow } from "@/lib/api-client/admin-products"
import { PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/api-client/image"

const statusBadgeVariant: Record<AdminProductStatus, "success" | "outline" | "destructive"> = {
  active: "success",
  inactive: "outline",
  "out-of-stock": "destructive",
}

const statusLabel: Record<AdminProductStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  "out-of-stock": "Out of Stock",
}

function stockDotClassName(stock: number) {
  if (stock === 0) return "bg-destructive"
  if (stock <= LOW_STOCK_THRESHOLD) return "bg-warning"
  return "bg-success"
}

function stockTextClassName(stock: number) {
  if (stock === 0) return "text-destructive"
  if (stock <= LOW_STOCK_THRESHOLD) return "text-warning-foreground"
  return "text-foreground"
}

function StockIndicator({ stock }: { stock: number }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-medium", stockTextClassName(stock))}>
      <span className={cn("size-1.5 rounded-full", stockDotClassName(stock))} aria-hidden />
      {stock === 0 ? "Out of stock" : `${stock} in stock`}
    </span>
  )
}

export type ProductsTableProps = {
  products: AdminProductRow[]
  onView: (product: AdminProductRow) => void
  onEdit: (product: AdminProductRow) => void
  onDelete: (product: AdminProductRow) => void
  onToggleActive: (product: AdminProductRow) => void
  /** Id of a product with a request in flight — its actions are disabled until it settles. */
  busyProductId?: string | null
}

function ActionsMenu({ product, onView, onEdit, onDelete, onToggleActive, busyProductId }: {
  product: AdminProductRow
} & Omit<ProductsTableProps, "products">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${product.name}`}
        disabled={busyProductId === product._id}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onView(product)}>
          <Eye className="size-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(product)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleActive(product)}>
          {product.isActive ? <EyeOff className="size-4" /> : <Power className="size-4" />}
          {product.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(product)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Products table — full table on desktop, stacked cards below `md` so nothing breaks on mobile. */
function ProductsTable({ products, ...actions }: ProductsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 text-left">Product</th>
              <th className="px-3 py-2.5 text-left">Category</th>
              <th className="px-3 py-2.5 text-left">Price</th>
              <th className="px-3 py-2.5 text-left">Stock</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-left">Rating</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE}
                      alt={product.name}
                      className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{product.name}</p>
                      <p className="text-caption text-muted-foreground">{product.sku ?? product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{product.categoryName ?? "—"}</td>
                <td className="px-3 py-3 font-medium text-foreground">{formatPrice(product.price)}</td>
                <td className="px-3 py-3">
                  <StockIndicator stock={product.stock} />
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusBadgeVariant[product.status]}>{statusLabel[product.status]}</Badge>
                </td>
                <td className="px-3 py-3">
                  <Rating value={product.rating} count={product.reviewCount} size="sm" />
                </td>
                <td className="px-3 py-3 text-right">
                  <ActionsMenu product={product} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {products.map((product) => (
          <div
            key={product._id}
            className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs"
          >
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.primaryImage?.imageUrl ?? PLACEHOLDER_PRODUCT_IMAGE}
                alt={product.name}
                className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-foreground">{product.name}</p>
                <p className="text-caption text-muted-foreground">{product.sku ?? product.slug}</p>
              </div>
              <ActionsMenu product={product} {...actions} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-small">
              <div>
                <span className="block text-caption text-muted-foreground">Category</span>
                {product.categoryName ?? "—"}
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Price</span>
                <span className="font-medium text-foreground">{formatPrice(product.price)}</span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Stock</span>
                <StockIndicator stock={product.stock} />
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant[product.status]}>{statusLabel[product.status]}</Badge>
              </div>
            </div>

            <div className="mt-2.5">
              <Rating value={product.rating} count={product.reviewCount} size="sm" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export { ProductsTable }
