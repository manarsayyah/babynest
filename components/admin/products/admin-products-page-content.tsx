"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, SearchX, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductsSummaryCards } from "@/components/admin/products/products-summary-cards"
import {
  ProductsToolbar,
  type ProductSortKey,
  type ProductStatusFilter,
  type StockStatusFilter,
} from "@/components/admin/products/products-toolbar"
import { ProductsTable } from "@/components/admin/products/products-table"
import { DeleteProductDialog } from "@/components/admin/products/delete-product-dialog"
import {
  ProductFormDialog,
  type ProductFormState,
  type ProductSaveOutcome,
} from "@/components/admin/products/product-form-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  setAdminProductActive,
  updateAdminProduct,
  type AdminProductListResponse,
  type AdminProductQuery,
  type AdminProductRow,
  type ProductDraft,
  type SaveProductResult,
} from "@/lib/api-client/admin-products"
import { fetchCategories } from "@/lib/api-client/categories"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import type { ApiCategory, ProductDetailResponse } from "@/lib/api-client/types"

const PAGE_SIZE = 8
const SEARCH_DEBOUNCE_MS = 300

// The toolbar's "healthy / low / out" stock filter maps 1:1 onto the API's `stock` param.
const stockFilterParam = { healthy: "healthy", low: "low", out: "out" } as const

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage products."
    if (err.status === 404) return "This product no longer exists."
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

/** Admin Products page: header, summary tiles, toolbar, table/cards, pagination — all backed by the real Products API. */
function AdminProductsPageContent() {
  const [data, setData] = React.useState<AdminProductListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [categories, setCategories] = React.useState<ApiCategory[]>([])
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [stockStatus, setStockStatus] = React.useState<StockStatusFilter>("all")
  const [productStatus, setProductStatus] = React.useState<ProductStatusFilter>("all")
  const [sort, setSort] = React.useState<ProductSortKey>("name-asc")
  const [page, setPage] = React.useState(1)

  const [formState, setFormState] = React.useState<ProductFormState | null>(null)
  const [productToDelete, setProductToDelete] = React.useState<AdminProductRow | null>(null)
  const [busyProductId, setBusyProductId] = React.useState<string | null>(null)

  const hasActiveFilters =
    search.trim().length > 0 || category !== "all" || stockStatus !== "all" || productStatus !== "all"

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  function handleClearFilters() {
    setSearch("")
    setDebouncedSearch("")
    setCategory("all")
    setStockStatus("all")
    setProductStatus("all")
    setPage(1)
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  // Category filter/form options come from the real Categories API.
  React.useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((result) => {
        if (!cancelled) setCategories(result)
      })
      .catch(() => {
        // Non-fatal: the product list still loads; the category filter just has no options.
      })
    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const query = React.useMemo<AdminProductQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      categoryId: category === "all" ? undefined : category,
      status: productStatus === "all" ? undefined : productStatus,
      stock: stockStatus === "all" ? undefined : stockFilterParam[stockStatus],
      sort,
    }),
    [page, debouncedSearch, category, stockStatus, productStatus, sort]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminProducts(query, { signal: controller.signal })
      .then((result) => {
        setData(result)
        setLoadError(null)
        setSettledKey(key)
        // The last row of the last page was removed — step back to a page that exists.
        if (result.items.length === 0 && result.total > 0 && (query.page ?? 1) > result.totalPages) {
          setPage(result.totalPages)
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err, "Something went wrong. Please try again."))
        setSettledKey(key)
      })

    return () => controller.abort()
  }, [query, reloadToken])

  const categoryOptions = React.useMemo(() => {
    const options = categories.map((c) => ({ value: c._id, label: c.name }))
    // A product whose category is inactive still needs its own category selectable when edited.
    if (formState?.mode === "edit" && formState.product.categoryName) {
      const { categoryId, categoryName } = formState.product
      if (!options.some((option) => option.value === categoryId)) {
        options.push({ value: categoryId, label: categoryName })
      }
    }
    return options
  }, [categories, formState])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, (currentPage - 1) * PAGE_SIZE + items.length)

  function handleView(product: AdminProductRow) {
    window.open(`/products/${product.slug}`, "_blank", "noopener,noreferrer")
  }

  async function handleToggleActive(product: AdminProductRow) {
    const nextActive = !product.isActive
    setBusyProductId(product._id)
    try {
      await setAdminProductActive(product._id, nextActive)
      toast.success(nextActive ? "Product activated" : "Product deactivated", {
        description: nextActive
          ? `${product.name} is visible in the store again.`
          : `${product.name} is now hidden from the store.`,
      })
    } catch (err) {
      toast.error(errorMessage(err, `Couldn't ${nextActive ? "activate" : "deactivate"} the product. Please try again.`))
    } finally {
      setBusyProductId(null)
      reload()
    }
  }

  async function handleDeleteConfirm(product: AdminProductRow) {
    try {
      await deleteAdminProduct(product._id)
      toast.success("Product deleted", { description: `${product.name} has been removed.` })
      setProductToDelete(null)
    } catch (err) {
      // A 404 means it's already gone — close the dialog and let the refresh show that.
      if (err instanceof ApiRequestError && err.status === 404) setProductToDelete(null)
      toast.error(errorMessage(err, "Couldn't delete the product. Please try again."))
    }
    reload()
  }

  async function handleSave(
    draft: ProductDraft,
    state: ProductFormState,
    original: ProductDetailResponse | null
  ): Promise<ProductSaveOutcome> {
    let result: SaveProductResult
    try {
      result =
        state.mode === "edit" && original
          ? await updateAdminProduct(state.product._id, draft, original)
          : await createAdminProduct(draft)
    } catch (err) {
      const fieldErrors = err instanceof ApiRequestError ? fieldErrorsFromDetails(err.details) : {}
      if (err instanceof ApiRequestError && err.status === 409) fieldErrors.slug = err.message
      return {
        ok: false,
        message: errorMessage(
          err,
          state.mode === "edit"
            ? "Couldn't update the product. Please try again."
            : "Couldn't add the product. Please try again."
        ),
        fieldErrors,
      }
    }

    setFormState(null)
    reload()

    if (result.failures.length > 0) {
      toast.error(state.mode === "edit" ? "Product saved, but some changes failed" : "Product added, but some details failed", {
        description: `${result.failures.join(" · ")} — open Edit to fix them.`,
      })
    } else {
      toast.success(state.mode === "edit" ? "Product updated" : "Product added", {
        description: `${draft.name.trim()} has been saved.`,
      })
    }
    return { ok: true }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 text-foreground">Products</h1>
          <p className="text-body text-muted-foreground">Manage your BabyNest product catalog</p>
        </div>
        <Button onClick={() => setFormState({ mode: "add" })} className="w-full sm:w-auto">
          <Plus data-icon="inline-start" />
          Add Product
        </Button>
      </div>

      <ProductsSummaryCards summary={data?.summary ?? null} />

      <Card className="p-5">
        <ProductsToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          category={category}
          onCategoryChange={resetToFirstPage(setCategory)}
          categoryOptions={categories.map((c) => ({ value: c._id, label: c.name }))}
          stockStatus={stockStatus}
          onStockStatusChange={resetToFirstPage(setStockStatus)}
          productStatus={productStatus}
          onProductStatusChange={resetToFirstPage(setProductStatus)}
          sort={sort}
          onSortChange={resetToFirstPage(setSort)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load products"
          description={loadError}
          action={
            <Button variant="outline" onClick={reload}>
              Try again
            </Button>
          }
        />
      ) : data === null ? (
        <Card className="p-5">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      ) : items.length > 0 ? (
        <Card className="p-0">
          <div className={isFetching ? "p-5 opacity-60 transition-opacity" : "p-5 transition-opacity"} aria-busy={isFetching}>
            <ProductsTable
              products={items}
              onView={handleView}
              onEdit={(product) => setFormState({ mode: "edit", product })}
              onDelete={setProductToDelete}
              onToggleActive={(product) => void handleToggleActive(product)}
              busyProductId={busyProductId}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} {total === 1 ? "product" : "products"}
            </p>
            <ProductsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No products found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Get started by adding your first product to the catalog."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setFormState({ mode: "add" })}>
                <Plus data-icon="inline-start" />
                Add Product
              </Button>
            )
          }
        />
      )}

      <ProductFormDialog
        state={formState}
        categoryOptions={categoryOptions}
        onClose={() => setFormState(null)}
        onSave={handleSave}
      />

      <DeleteProductDialog
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export { AdminProductsPageContent }
