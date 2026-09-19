"use client"

import { Ban, CheckCircle2, Eye, MoreVertical, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  categoryImage,
  formatCategoryDate,
  type AdminCategoryRow,
  type CategoryStatus,
} from "@/lib/api-client/admin-categories"

const statusBadgeVariant: Record<CategoryStatus, "success" | "outline"> = {
  active: "success",
  inactive: "outline",
}

const statusLabel: Record<CategoryStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

export type CategoriesGridProps = {
  categories: AdminCategoryRow[]
  onViewProducts: (category: AdminCategoryRow) => void
  onEdit: (category: AdminCategoryRow) => void
  onDisable: (category: AdminCategoryRow) => void
  onEnable: (category: AdminCategoryRow) => void
  /** Id of a category with a request in flight — its actions are disabled until it settles. */
  busyCategoryId?: string | null
}

function ActionsMenu({ category, onViewProducts, onEdit, onDisable, onEnable, busyCategoryId }: {
  category: AdminCategoryRow
} & Omit<CategoriesGridProps, "categories">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${category.name}`}
        disabled={busyCategoryId === category._id}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onViewProducts(category)}>
          <Eye className="size-4" />
          View Products
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(category)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        {category.status === "active" ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDisable(category)}>
            <Ban className="size-4" />
            Disable
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onEnable(category)}>
            <CheckCircle2 className="size-4" />
            Enable
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Category cards — image, name, description, product count, status, created date and an actions menu. */
function CategoriesGrid({ categories, ...actions }: CategoriesGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <Card key={category._id} className="gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={categoryImage(category)}
              alt=""
              className="size-12 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
            />
            <ActionsMenu category={category} {...actions} />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-body font-semibold text-foreground">{category.name}</h3>
              <Badge variant={statusBadgeVariant[category.status]}>{statusLabel[category.status]}</Badge>
            </div>
            <p className="line-clamp-2 text-small text-muted-foreground">{category.description}</p>
            {category.parent ? (
              <p className="text-caption text-muted-foreground">Subcategory of {category.parent.name}</p>
            ) : category.childCount > 0 ? (
              <p className="text-caption text-muted-foreground">
                {category.childCount} {category.childCount === 1 ? "subcategory" : "subcategories"}
              </p>
            ) : null}
          </div>

          <div className="mt-1 flex items-center justify-between text-caption text-muted-foreground">
            <span className="font-medium text-foreground">
              {category.productCount} {category.productCount === 1 ? "product" : "products"}
            </span>
            <span>Created {formatCategoryDate(category.createdAt)}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}

export { CategoriesGrid }
