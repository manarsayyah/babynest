"use client"

import * as React from "react"
import { toast } from "sonner"
import { UserSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { CustomersSummaryCards } from "@/components/admin/customers/customers-summary-cards"
import {
  CustomersToolbar,
  type CustomerSortKey,
  type CustomerStatusFilter,
  type RegistrationDateFilter,
} from "@/components/admin/customers/customers-toolbar"
import { CustomersTable } from "@/components/admin/customers/customers-table"
import { DisableCustomerDialog } from "@/components/admin/customers/disable-customer-dialog"
import { ProductsPagination } from "@/components/shop/products-pagination"
import { adminCustomers, type AdminCustomer } from "@/lib/mock/admin-customers"

const PAGE_SIZE = 8

function withinRegistrationRange(customer: AdminCustomer, range: RegistrationDateFilter) {
  if (range === "all") return true
  const joined = new Date(customer.joinedDate)
  const now = new Date()
  if (range === "year") return joined.getFullYear() === now.getFullYear()
  const days = range === "30" ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return joined >= cutoff
}

/** Admin Customers page: header, summary tiles, toolbar, table/cards, pagination — client-side over the customer directory. */
function AdminCustomersPageContent() {
  const [customers, setCustomers] = React.useState<AdminCustomer[]>(adminCustomers)
  const [search, setSearch] = React.useState("")
  const [status, setStatus] = React.useState<CustomerStatusFilter>("all")
  const [registrationDate, setRegistrationDate] = React.useState<RegistrationDateFilter>("all")
  const [sort, setSort] = React.useState<CustomerSortKey>("newest")
  const [page, setPage] = React.useState(1)
  const [customerToDisable, setCustomerToDisable] = React.useState<AdminCustomer | null>(null)

  const hasActiveFilters = search.trim().length > 0 || status !== "all" || registrationDate !== "all"

  function resetToFirstPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  function handleClearFilters() {
    setSearch("")
    setStatus("all")
    setRegistrationDate("all")
    setPage(1)
  }

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = customers.filter((customer) => {
      if (status !== "all" && customer.status !== status) return false
      if (!withinRegistrationRange(customer, registrationDate)) return false
      if (
        query &&
        !customer.name.toLowerCase().includes(query) &&
        !customer.email.toLowerCase().includes(query) &&
        !customer.id.toLowerCase().includes(query)
      ) {
        return false
      }
      return true
    })

    const sorted = [...result]
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime())
        break
      case "orders-desc":
        sorted.sort((a, b) => b.ordersCount - a.ordersCount)
        break
      case "spent-desc":
        sorted.sort((a, b) => b.totalSpent - a.totalSpent)
        break
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        sorted.sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())
        break
    }
    return sorted
  }, [customers, search, status, registrationDate, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(filtered.length, currentPage * PAGE_SIZE)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleView(customer: AdminCustomer) {
    toast(`Viewing ${customer.name}`, { description: "Customer detail view isn't wired up yet." })
  }

  function handleViewOrders(customer: AdminCustomer) {
    toast(`${customer.name}'s orders`, { description: "Filtering orders by customer isn't wired up yet." })
  }

  function handleEdit(customer: AdminCustomer) {
    toast(`Editing ${customer.name}`, { description: "Customer editing isn't wired up yet." })
  }

  function handleEnable(customer: AdminCustomer) {
    setCustomers((prev) => prev.map((c) => (c.id === customer.id ? { ...c, status: "active" } : c)))
    toast.success("Customer enabled", { description: `${customer.name} can sign in again.` })
  }

  function handleDisableConfirm(customerId: string) {
    setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...c, status: "inactive" } : c)))
    setCustomerToDisable(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Customers</h1>
        <p className="text-body text-muted-foreground">Manage and view your BabyNest customers</p>
      </div>

      <CustomersSummaryCards customers={customers} />

      <Card className="p-5">
        <CustomersToolbar
          search={search}
          onSearchChange={resetToFirstPage(setSearch)}
          status={status}
          onStatusChange={resetToFirstPage(setStatus)}
          registrationDate={registrationDate}
          onRegistrationDateChange={resetToFirstPage(setRegistrationDate)}
          sort={sort}
          onSortChange={setSort}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
        />
      </Card>

      {paged.length > 0 ? (
        <Card className="p-0">
          <div className="p-5">
            <CustomersTable
              customers={paged}
              onView={handleView}
              onViewOrders={handleViewOrders}
              onEdit={handleEdit}
              onDisable={setCustomerToDisable}
              onEnable={handleEnable}
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-muted-foreground">
              Showing {rangeStart}-{rangeEnd} of {filtered.length} {filtered.length === 1 ? "customer" : "customers"}
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

      <DisableCustomerDialog
        customer={customerToDisable}
        onClose={() => setCustomerToDisable(null)}
        onConfirm={handleDisableConfirm}
      />
    </div>
  )
}

export { AdminCustomersPageContent }
