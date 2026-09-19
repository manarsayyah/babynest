"use client"

import * as React from "react"
import { toast } from "sonner"
import { FolderPlus, Plus, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CategoriesSummaryCards } from "@/components/admin/categories/categories-summary-cards"
import {
  CategoriesToolbar,
  type CategorySortKey,
  type CategoryStatusFilter,
} from "@/components/admin/categories/categories-toolbar"
import { CategoriesGrid } from "@/components/admin/categories/categories-grid"
import {
  CategoryFormDialog,
  type CategoryFormState,
  type CategoryFormValues,
  type CategorySaveOutcome,
} from "@/components/admin/categories/category-form-dialog"
import { DisableCategoryDialog } from "@/components/admin/categories/disable-category-dialog"
import {
  createAdminCategory,
  fetchAllAdminCategories,
  slugifyName,
  updateAdminCategory,
  type AdminCategoryListResponse,
  type AdminCategoryQuery,
  type AdminCategoryRow,
} from "@/lib/api-client/admin-categories"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const SEARCH_DEBOUNCE_MS = 300
const MAX_SLUG_ATTEMPTS = 6

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage categories."
    if (err.status === 404) return "This category no longer exists."
    if (err.status < 500) return err.message
  }
  return fallback
}

/** Flattens the server's `{ field: string[] }` validation details into one message per field. */
function fieldErrorsFromDetails(details: unknown): Record<string, string> {
  if (!details || typeof details !== "object") return {}
  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") result[field] = messages[0]
  }
  return result
}

/** Admin Categories page: header, summary tiles, toolbar, category cards, add/edit + disable dialogs — all backed by the real Categories API. */
function AdminCategoriesPageContent() {
  const [data, setData] = React.useState<AdminCategoryListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [status, setStatus] = React.useState<CategoryStatusFilter>("all")
  const [sort, setSort] = React.useState<CategorySortKey>("name-asc")

  const [formState, setFormState] = React.useState<CategoryFormState | null>(null)
  const [categoryToDisable, setCategoryToDisable] = React.useState<AdminCategoryRow | null>(null)
  const [busyCategoryId, setBusyCategoryId] = React.useState<string | null>(null)

  const hasActiveFilters = search.trim().length > 0 || status !== "all"

  function handleClearFilters() {
    setSearch("")
    setDebouncedSearch("")
    setStatus("all")
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const query = React.useMemo<Omit<AdminCategoryQuery, "page" | "limit">>(
    () => ({ search: debouncedSearch, status: status === "all" ? undefined : status, sort }),
    [debouncedSearch, status, sort]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAllAdminCategories(query, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setLoadError(null)
        setSettledKey(key)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
        setSettledKey(key)
      })

    return () => controller.abort()
  }, [query, reloadToken])

  const items = data?.items ?? []

  function handleViewProducts(category: AdminCategoryRow) {
    if (category.status !== "active") {
      toast("Category is disabled", { description: "Enable it to see its products in the store." })
      return
    }
    // The storefront's own category links use /products?category=<slug>.
    window.open(`/products?category=${category.slug}`, "_blank", "noopener,noreferrer")
  }

  async function setStatusFor(category: AdminCategoryRow, next: "active" | "inactive") {
    await updateAdminCategory(category._id, { status: next })
    toast.success(next === "active" ? "Category enabled" : "Category disabled", {
      description:
        next === "active" ? `${category.name} is visible in the shop again.` : `${category.name} has been disabled.`,
    })
  }

  async function handleEnable(category: AdminCategoryRow) {
    setBusyCategoryId(category._id)
    try {
      await setStatusFor(category, "active")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't enable the category. Please try again."))
    } finally {
      setBusyCategoryId(null)
      reload()
    }
  }

  async function handleDisableConfirm(category: AdminCategoryRow) {
    try {
      await setStatusFor(category, "inactive")
      setCategoryToDisable(null)
    } catch (err) {
      // A 404 means it's already gone — close the dialog and let the refresh show that.
      if (err instanceof ApiRequestError && err.status === 404) setCategoryToDisable(null)
      toast.error(errorMessage(err, "Couldn't disable the category. Please try again."))
    }
    reload()
  }

  async function handleSaveCategory(values: CategoryFormValues, state: CategoryFormState): Promise<CategorySaveOutcome> {
    try {
      if (state.mode === "edit") {
        await updateAdminCategory(state.category._id, values)
      } else {
        // The form has no slug field: derive one from the name and, if it's taken (slugs are unique even
        // across retired categories), try name-2, name-3... rather than failing the whole save.
        const base = slugifyName(values.name) || "category"
        const known = new Set(data?.options.map((option) => option.slug) ?? [])
        let attempt = 1
        for (;;) {
          const slug = attempt === 1 ? base : `${base}-${attempt}`
          if (known.has(slug) && attempt < MAX_SLUG_ATTEMPTS) {
            attempt++
            continue
          }
          try {
            await createAdminCategory(values, slug)
            break
          } catch (err) {
            if (err instanceof ApiRequestError && err.status === 409 && attempt < MAX_SLUG_ATTEMPTS) {
              attempt++
              continue
            }
            throw err
          }
        }
      }
    } catch (err) {
      const fieldErrors = err instanceof ApiRequestError ? fieldErrorsFromDetails(err.details) : {}
      // Server-side parent rules (self-parent, unknown parent, circular) come back as a plain 400 message.
      if (err instanceof ApiRequestError && err.status === 400 && /parent|circular/i.test(err.message)) {
        fieldErrors.parentCategoryId = err.message
      }
      return {
        ok: false,
        message: errorMessage(
          err,
          state.mode === "edit" ? "Couldn't update the category. Please try again." : "Couldn't add the category. Please try again."
        ),
        fieldErrors,
      }
    }

    setFormState(null)
    reload()
    toast.success(state.mode === "edit" ? "Category updated" : "Category added", {
      description: `${values.name} has been saved.`,
    })
    return { ok: true }
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

      <CategoriesSummaryCards summary={data?.summary ?? null} />

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

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load categories"
          description={loadError}
          action={
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : data === null ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={isFetching}>
          <CategoriesGrid
            categories={items}
            onViewProducts={handleViewProducts}
            onEdit={(category) => setFormState({ mode: "edit", category })}
            onDisable={setCategoryToDisable}
            onEnable={(category) => void handleEnable(category)}
            busyCategoryId={busyCategoryId}
          />
        </div>
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

      <CategoryFormDialog
        state={formState}
        options={data?.options ?? []}
        onClose={() => setFormState(null)}
        onSave={handleSaveCategory}
      />

      <DisableCategoryDialog
        category={categoryToDisable}
        onClose={() => setCategoryToDisable(null)}
        onConfirm={handleDisableConfirm}
      />
    </div>
  )
}

export { AdminCategoriesPageContent }
