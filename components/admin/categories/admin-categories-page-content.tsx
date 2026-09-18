"use client"

import * as React from "react"
import { toast } from "sonner"
import { FolderPlus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { CategoriesSummaryCards } from "@/components/admin/categories/categories-summary-cards"
import {
  CategoriesToolbar,
  type CategorySortKey,
  type CategoryStatusFilter,
} from "@/components/admin/categories/categories-toolbar"
import { CategoriesGrid } from "@/components/admin/categories/categories-grid"
import { CategoryFormDialog, type CategoryFormState, type CategoryFormValues } from "@/components/admin/categories/category-form-dialog"
import { DisableCategoryDialog } from "@/components/admin/categories/disable-category-dialog"
import { adminCategories, type AdminCategory } from "@/lib/mock/admin-categories"

function slugify(name: string, existing: Set<string>) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "category"

  let candidate = base
  let suffix = 2
  while (existing.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

/** Admin Categories page: header, summary tiles, toolbar, category cards, add/edit + disable dialogs. */
function AdminCategoriesPageContent() {
  const [categories, setCategories] = React.useState<AdminCategory[]>(adminCategories)
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<CategoryStatusFilter>("all")
  const [sort, setSort] = React.useState<CategorySortKey>("name-asc")
  const [formState, setFormState] = React.useState<CategoryFormState | null>(null)
  const [categoryToDisable, setCategoryToDisable] = React.useState<AdminCategory | null>(null)

  const hasActiveFilters = search.trim().length > 0 || status !== "all"

  function handleClearFilters() {
    setSearch("")
    setStatus("all")
  }

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = categories.filter((category) => {
      if (status !== "all" && category.status !== status) return false
      if (
        query &&
        !category.name.toLowerCase().includes(query) &&
        !category.description.toLowerCase().includes(query)
      ) {
        return false
      }
      return true
    })

    const sorted = [...result]
    switch (sort) {
      case "products-desc":
        sorted.sort((a, b) => b.productCount - a.productCount)
        break
      case "products-asc":
        sorted.sort((a, b) => a.productCount - b.productCount)
        break
      case "newest":
        sorted.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        break
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
    }
    return sorted
  }, [categories, search, status, sort])

  function handleViewProducts(category: AdminCategory) {
    toast(`${category.name} products`, { description: "Filtering products by category isn't wired up yet." })
  }

  function handleEnable(category: AdminCategory) {
    setCategories((prev) => prev.map((c) => (c.slug === category.slug ? { ...c, status: "active" } : c)))
    toast.success("Category enabled", { description: `${category.name} is visible in the shop again.` })
  }

  function handleDisableConfirm(categorySlug: string) {
    setCategories((prev) => prev.map((c) => (c.slug === categorySlug ? { ...c, status: "inactive" } : c)))
    setCategoryToDisable(null)
  }

  function handleSaveCategory(values: CategoryFormValues, state: CategoryFormState) {
    if (state.mode === "edit") {
      setCategories((prev) =>
        prev.map((c) =>
          c.slug === state.category.slug
            ? { ...c, name: values.name, description: values.description, image: values.image, status: values.status }
            : c
        )
      )
    } else {
      const slug = slugify(values.name, new Set(categories.map((c) => c.slug)))
      const newCategory: AdminCategory = {
        slug,
        name: values.name,
        description: values.description,
        image: values.image,
        tintClassName: "bg-[#FCEAE3]",
        status: values.status,
        createdDate: new Date().toISOString().slice(0, 10),
        productCount: 0,
      }
      setCategories((prev) => [newCategory, ...prev])
    }
    setFormState(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-foreground">Categories</h1>
          <p className="text-body text-muted-foreground">Organize and manage your BabyNest product categories</p>
        </div>
        <Button onClick={() => setFormState({ mode: "add" })} className="w-full sm:w-auto">
          <Plus data-icon="inline-start" />
          Add Category
        </Button>
      </div>

      <CategoriesSummaryCards categories={categories} />

      <Card className="p-5">
        <CategoriesToolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          sort={sort}
          onSortChange={setSort}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {filtered.length > 0 ? (
        <CategoriesGrid
          categories={filtered}
          onViewProducts={handleViewProducts}
          onEdit={(category) => setFormState({ mode: "edit", category })}
          onDisable={setCategoryToDisable}
          onEnable={handleEnable}
        />
      ) : (
        <EmptyState
          icon={FolderPlus}
          title="No categories found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Get started by adding your first product category."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setFormState({ mode: "add" })}>
                <Plus data-icon="inline-start" />
                Add Category
              </Button>
            )
          }
        />
      )}

      <CategoryFormDialog state={formState} onClose={() => setFormState(null)} onSave={handleSaveCategory} />

      <DisableCategoryDialog
        category={categoryToDisable}
        onClose={() => setCategoryToDisable(null)}
        onConfirm={handleDisableConfirm}
      />
    </div>
  )
}

export { AdminCategoriesPageContent }
