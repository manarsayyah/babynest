"use client"

import * as React from "react"
import { toast } from "sonner"
import { TriangleAlert, UserSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomersSummaryCards } from "@/components/admin/customers/customers-summary-cards"
import {
  CustomersToolbar,
  type CustomerSortKey,
  type CustomerStatusFilter,
  type RegistrationDateFilter,
} from "@/components/admin/customers/customers-toolbar"
import { CustomersTable } from "@/components/admin/customers/customers-table"
import { DisableCustomerDialog } from "@/components/admin/customers/disable-customer-dialog"
import { CustomerDetailDialog, type CustomerDetailState } from "@/components/admin/customers/customer-detail-dialog"
import {
  CustomerFormDialog,
  type CustomerFormValues,
  type CustomerSaveOutcome,
} from "@/components/admin/customers/customer-form-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import {
  fetchAdminCustomers,
  updateAdminCustomer,
  type AdminCustomerListResponse,
  type AdminCustomerQuery,
  type AdminCustomerRow,
} from "@/lib/api-client/admin-customers"
import { ApiRequestError } from "@/lib/api-client/fetcher"

const PAGE_SIZE = 8
const SEARCH_DEBOUNCE_MS = 300

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to manage customers."
    if (err.status === 404) return "This customer no longer exists."
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

/** Admin Customers page: header, summary tiles, toolbar, table/cards, pagination — all backed by the real Users/Orders data. */
function AdminCustomersPageContent() {
  const [data, setData] = React.useState<AdminCustomerListResponse | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  // Key of the last request that settled; while it differs from the current request key, a fetch is in flight.
  const [settledKey, setSettledKey] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [status, setStatus] = React.useState<CustomerStatusFilter>("all")
  const [registrationDate, setRegistrationDate] = React.useState<RegistrationDateFilter>("all")
  const [sort, setSort] = React.useState<CustomerSortKey>("newest")
  const [page, setPage] = React.useState(1)

  const [detail, setDetail] = React.useState<CustomerDetailState | null>(null)
  const [customerToEdit, setCustomerToEdit] = React.useState<AdminCustomerRow | null>(null)
  const [customerToDisable, setCustomerToDisable] = React.useState<AdminCustomerRow | null>(null)
  const [busyCustomerId, setBusyCustomerId] = React.useState<string | null>(null)

  const hasActiveFilters = search.trim().length > 0 || status !== "all" || registrationDate !== "all"

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
    setRegistrationDate("all")
    setPage(1)
  }

  const reload = React.useCallback(() => setReloadToken((n) => n + 1), [])

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search])

  const query = React.useMemo<AdminCustomerQuery>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status: status === "all" ? undefined : status,
      dateRange: registrationDate === "all" ? undefined : registrationDate,
      sort,
    }),
    [page, debouncedSearch, status, registrationDate, sort]
  )
  const requestKey = `${JSON.stringify(query)}#${reloadToken}`
  const isFetching = settledKey !== requestKey

  React.useEffect(() => {
    const controller = new AbortController()
    const key = `${JSON.stringify(query)}#${reloadToken}`

    fetchAdminCustomers(query, { signal: controller.signal })
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

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const currentPage = Math.min(page, totalPages)
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(total, (currentPage - 1) * PAGE_SIZE + items.length)

  async function handleEnable(customer: AdminCustomerRow) {
    setBusyCustomerId(customer._id)
    try {
      await updateAdminCustomer(customer._id, { status: "active" })
      toast.success("Customer enabled", { description: `${customer.name} is active again.` })
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't enable the customer. Please try again."))
    } finally {
      setBusyCustomerId(null)
      reload()
    }
  }

  async function handleDisableConfirm(customer: AdminCustomerRow) {
    try {
      await updateAdminCustomer(customer._id, { status: "inactive" })
      toast.success("Customer disabled", { description: `${customer.name} has been disabled.` })
      setCustomerToDisable(null)
    } catch (err) {
      // A 404 means it's already gone — close the dialog and let the refresh show that.
      if (err instanceof ApiRequestError && err.status === 404) setCustomerToDisable(null)
      toast.error(errorMessage(err, "Couldn't disable the customer. Please try again."))
    }
    reload()
  }

  async function handleSave(values: CustomerFormValues, customer: AdminCustomerRow): Promise<CustomerSaveOutcome> {
    try {
      await updateAdminCustomer(customer._id, values)
    } catch (err) {
      const fieldErrors = err instanceof ApiRequestError ? fieldErrorsFromDetails(err.details) : {}
      if (err instanceof ApiRequestError && err.status === 409) fieldErrors.email = err.message
      return { ok: false, message: errorMessage(err, "Couldn't update the customer. Please try again."), fieldErrors }
    }

    setCustomerToEdit(null)
    reload()
    toast.success("Customer updated", { description: `${values.firstName} ${values.lastName} has been saved.` })
    return { ok: true }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-admin-title text-foreground">Customers</h1>
        <p className="text-body text-muted-foreground">Manage and view your BabyNest customers</p>
      </div>

      <CustomersSummaryCards summary={data?.summary ?? null} />

      <Card className="p-5">
        <CustomersToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          status={status}
          onStatusChange={resetToFirstPage(setStatus)}
          registrationDate={registrationDate}
          onRegistrationDateChange={resetToFirstPage(setRegistrationDate)}
          sort={sort}
          onSortChange={resetToFirstPage(setSort)}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {loadError ? (
        <EmptyState
          icon={TriangleAlert}
          title="Couldn't load customers"
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
            <CustomersTable
              customers={items}
              onView={(customer) => setDetail({ customer, focus: "profile" })}
              onViewOrders={(customer) => setDetail({ customer, focus: "orders" })}
              onEdit={setCustomerToEdit}
              onDisable={setCustomerToDisable}
              onEnable={(customer) => void handleEnable(customer)}
              busyCustomerId={busyCustomerId}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {total} {total === 1 ? "customer" : "customers"}
            </p>
            <ProductsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </Card>
      ) : (
        <EmptyState
          icon={UserSearch}
          title="No customers found"
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters."
              : "Customers will show up here once they create an account."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      )}

      <CustomerDetailDialog state={detail} onClose={() => setDetail(null)} />

      <CustomerFormDialog customer={customerToEdit} onClose={() => setCustomerToEdit(null)} onSave={handleSave} />

      <DisableCustomerDialog
        customer={customerToDisable}
        onClose={() => setCustomerToDisable(null)}
        onConfirm={handleDisableConfirm}
      />
    </div>
  )
}

export { AdminCustomersPageContent }
