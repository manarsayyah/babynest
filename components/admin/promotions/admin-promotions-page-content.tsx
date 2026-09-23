"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, SearchX, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { PromotionsSummaryCards } from "@/components/admin/promotions/promotions-summary-cards"
import { PromotionsToolbar, type PromotionStatusFilter } from "@/components/admin/promotions/promotions-toolbar"
import { PromotionsTable } from "@/components/admin/promotions/promotions-table"
import { DeletePromotionDialog } from "@/components/admin/promotions/delete-promotion-dialog"
import {
  PromotionFormDialog,
  type PromotionFormState,
  type PromotionSaveOutcome,
} from "@/components/admin/promotions/promotion-form-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import {
  createAdminPromotion,
  deleteAdminPromotion,
  fetchAdminPromotions,
  fetchAdminPromotionsSummary,
  updateAdminPromotion,
  type AdminPromotionListResponse,
  type AdminPromotionQuery,
  type AdminPromotionRow,
  type AdminPromotionSummary,
  type PromotionDraft,
} from "@/lib/api-client/admin-promotions"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const PAGE_SIZE = 8

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage promotions."
    if (err.status === 404) return "This promotion no longer exists."
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

/** Admin Promotions page: header, summary tiles, toolbar, table/cards, pagination — all backed by the real Promotions API. */
function AdminPromotionsPageContent() {
  const [data, setData] = React.useState<AdminPromotionListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [summary, setSummary] = React.useState<AdminPromotionSummary | null>(null)

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [status, setStatus] = React.useState<PromotionStatusFilter>("all")
  const [page, setPage] = React.useState(1)

  const [formState, setFormState] = React.useState<PromotionFormState | null>(null)
  const [promotionToDelete, setPromotionToDelete] = React.useState<AdminPromotionRow | null>(null)
  const [busyPromotionId, setBusyPromotionId] = React.useState<string | null>(null)

  const hasActiveFilters = search.trim().length > 0 || status !== "all"

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  function handleClearFilters() {
    setSearch("")
    setDebouncedSearch("")
    setStatus("all")
    setPage(1)
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const query = React.useMemo<AdminPromotionQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      code: debouncedSearch || undefined,
      isActive: status === "all" ? undefined : status === "active",
    }),
    [page, debouncedSearch, status]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminPromotions(query, { signal: controller.signal })
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

  // Summary tiles are independent of the toolbar's filters/pagination (same split as ProductsSummaryCards).
  React.useEffect(() => {
    let cancelled = false
    fetchAdminPromotionsSummary()
      .then((result) => {
        if (!cancelled) setSummary(result)
      })
      .catch(() => {
        // Non-fatal: the table still loads; the tiles just stay blank.
      })
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, (currentPage - 1) * PAGE_SIZE + items.length)

  async function handleToggleActive(promotion: AdminPromotionRow) {
    const nextActive = !promotion.isActive
    setBusyPromotionId(promotion._id)
    try {
      await updateAdminPromotion(promotion._id, {
        code: promotion.code,
        description: promotion.description ?? "",
        discountType: promotion.discountType,
        discountValue: String(promotion.discountValue),
        startDate: promotion.startDate.slice(0, 10),
        endDate: promotion.endDate.slice(0, 10),
        isActive: nextActive,
      })
      toast.success(nextActive ? "Promotion activated" : "Promotion deactivated", {
        description: nextActive
          ? `${promotion.code} can be applied at checkout again.`
          : `${promotion.code} is now rejected at checkout.`,
      })
    } catch (err) {
      toast.error(errorMessage(err, `Couldn't ${nextActive ? "activate" : "deactivate"} the promotion. Please try again.`))
    } finally {
      setBusyPromotionId(null)
      reload()
    }
  }

  async function handleDeleteConfirm(promotion: AdminPromotionRow) {
    try {
      await deleteAdminPromotion(promotion._id)
      toast.success("Promotion deleted", { description: `${promotion.code} has been removed.` })
      setPromotionToDelete(null)
    } catch (err) {
      // A 404 means it's already gone — close the dialog and let the refresh show that.
      if (err instanceof ApiRequestError && err.status === 404) setPromotionToDelete(null)
      toast.error(errorMessage(err, "Couldn't delete the promotion. Please try again."))
    }
    reload()
  }

  async function handleSave(draft: PromotionDraft, state: PromotionFormState): Promise<PromotionSaveOutcome> {
    try {
      if (state.mode === "edit") {
        await updateAdminPromotion(state.promotion._id, draft)
      } else {
        await createAdminPromotion(draft)
      }
    } catch (err) {
      const fieldErrors = err instanceof ApiRequestError ? fieldErrorsFromDetails(err.details) : {}
      if (err instanceof ApiRequestError && err.status === 409) fieldErrors.code = err.message
      return {
        ok: false,
        message: errorMessage(
          err,
          state.mode === "edit" ? "Couldn't update the promotion. Please try again." : "Couldn't add the promotion. Please try again."
        ),
        fieldErrors,
      }
    }

    setFormState(null)
    reload()
    toast.success(state.mode === "edit" ? "Promotion updated" : "Promotion added", {
      description: `${draft.code.trim().toUpperCase()} has been saved.`,
    })
    return { ok: true }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-admin-title text-foreground">Promotions</h1>
          <p className="text-body text-muted-foreground">Manage the promo codes customers can apply at checkout</p>
        </div>
        <Button onClick={() => setFormState({ mode: "add" })} className="w-full sm:w-auto">
          <Plus data-icon="inline-start" />
          Add Promotion
        </Button>
      </div>

      <PromotionsSummaryCards summary={summary} />

      <Card className="p-5">
        <PromotionsToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          status={status}
          onStatusChange={resetToFirstPage(setStatus)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load promotions"
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
            <PromotionsTable
              promotions={items}
              onEdit={(promotion) => setFormState({ mode: "edit", promotion })}
              onDelete={setPromotionToDelete}
              onToggleActive={(promotion) => void handleToggleActive(promotion)}
              busyPromotionId={busyPromotionId}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} {total === 1 ? "promotion" : "promotions"}
            </p>
            <ProductsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={SearchX}
          title="No promotions found"
          description={
            hasActiveFilters ? "Try adjusting your search or filters." : "Get started by creating your first promo code."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => setFormState({ mode: "add" })}>
                <Plus data-icon="inline-start" />
                Add Promotion
              </Button>
            )
          }
        />
      )}

      <PromotionFormDialog state={formState} onClose={() => setFormState(null)} onSave={handleSave} />

      <DeletePromotionDialog
        promotion={promotionToDelete}
        onClose={() => setPromotionToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

export { AdminPromotionsPageContent }
