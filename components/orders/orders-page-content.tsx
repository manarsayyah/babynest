"use client"

import * as React from "react"
import Link from "next/link"
import { PackageOpen, TriangleAlert } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { OrderCard } from "@/components/orders/order-card"
import { OrderCardSkeleton } from "@/components/orders/order-card-skeleton"
import { OrdersToolbar, type DateRangeFilter, type SortKey, type StatusFilter } from "@/components/orders/orders-toolbar"
import { fetchOrders, type Order } from "@/lib/api-client/orders"
import { ApiRequestError } from "@/lib/api-client/fetcher"
import { initialProfile } from "@/lib/mock/account"

function withinDateRange(order: Order, range: DateRangeFilter) {
  if (range === "all") return true
  const orderDate = new Date(order.date)
  const now = new Date()
  if (range === "year") return orderDate.getFullYear() === now.getFullYear()
  const days = range === "30" ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return orderDate >= cutoff
}

/** Full My Orders page: filter tabs, search/date/sort toolbar, order card list, cancel dialog, empty/loading states. */
function OrdersPageContent() {
  const [ordersState, setOrdersState] = React.useState<Order[] | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [search, setSearch] = React.useState("")
  const [dateRange, setDateRange] = React.useState<DateRangeFilter>("all")
  const [sort, setSort] = React.useState<SortKey>("newest")

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await fetchOrders()
        if (cancelled) return
        setOrdersState(result)
        setLoadError(null)
      } catch (err) {
        if (cancelled) return
        setOrdersState(null)
        setLoadError(
          err instanceof ApiRequestError && err.status === 401
            ? "Please sign in again to see your orders."
            : "Something went wrong. Please try again."
        )
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  const orderList = React.useMemo(() => ordersState ?? [], [ordersState])

  const counts = React.useMemo(() => {
    const base: Record<StatusFilter, number> = {
      all: orderList.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    }
    orderList.forEach((order) => {
      base[order.status] += 1
    })
    return base
  }, [orderList])

  const filteredOrders = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    const result = orderList.filter((order) => {
      if (status !== "all" && order.status !== status) return false
      if (!withinDateRange(order, dateRange)) return false
      if (query) {
        const matchesId = order.id.toLowerCase().includes(query)
        const matchesProduct = order.items.some((item) =>
          item.product.name.toLowerCase().includes(query)
        )
        if (!matchesId && !matchesProduct) return false
      }
      return true
    })

    const sorted = [...result]
    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "amount-desc":
        sorted.sort((a, b) => b.total - a.total)
        break
      case "amount-asc":
        sorted.sort((a, b) => a.total - b.total)
        break
      default:
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
    }
    return sorted
  }, [orderList, status, dateRange, search, sort])

  return (
    <main className="flex-1">
      <Container className="account-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb
              items={[{ label: "Home", href: "/" }, { label: "My Account", href: "/account" }, { label: "Orders" }]}
            />
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-account-title text-foreground">My Orders</h1>
              <Badge variant="secondary">{orderList.length} Orders</Badge>
            </div>
            <p className="text-body text-muted-foreground">
              Track your purchases, view order details, and manage your BabyNest orders.
            </p>
          </div>

          <OrdersToolbar
            counts={counts}
            status={status}
            onStatusChange={setStatus}
            search={search}
            onSearchChange={setSearch}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            sort={sort}
            onSortChange={setSort}
          />

          {loadError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't load your orders"
              description={loadError}
              action={
                <Button variant="outline" onClick={() => setReloadToken((n) => n + 1)}>
                  Try again
                </Button>
              }
            />
          ) : ordersState === null ? (
            <div className="flex flex-col gap-5">
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </div>
          ) : orderList.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="No Orders Yet"
              description="Your BabyNest journey starts here."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button size="lg" nativeButton={false} render={<Link href="/products" />}>
                    Start Shopping
                  </Button>
                  <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/categories" />}>
                    Explore Categories
                  </Button>
                </div>
              }
            />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              title="No orders match your filters"
              description="Try a different status, date range or search term."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatus("all")
                    setSearch("")
                    setDateRange("all")
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {filteredOrders.map((order) => (
                <OrderCard key={order.routeId} order={order} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  )
}

export { OrdersPageContent }
