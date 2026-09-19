"use client"

import { Ban, CheckCircle2, Eye, MoreVertical, Pencil, ShoppingBag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatPrice } from "@/lib/format"
import {
  customerAvatar,
  formatCustomerDate,
  shortCustomerId,
  type AdminCustomerRow,
  type CustomerStatus,
} from "@/lib/api-client/admin-customers"

const statusBadgeVariant: Record<CustomerStatus, "success" | "outline"> = {
  active: "success",
  inactive: "outline",
}

const statusLabel: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
}

export type CustomersTableProps = {
  customers: AdminCustomerRow[]
  onView: (customer: AdminCustomerRow) => void
  onViewOrders: (customer: AdminCustomerRow) => void
  onEdit: (customer: AdminCustomerRow) => void
  onDisable: (customer: AdminCustomerRow) => void
  onEnable: (customer: AdminCustomerRow) => void
  /** Id of a customer with a request in flight — its actions are disabled until it settles. */
  busyCustomerId?: string | null
}

function ActionsMenu({ customer, onView, onViewOrders, onEdit, onDisable, onEnable, busyCustomerId }: {
  customer: AdminCustomerRow
} & Omit<CustomersTableProps, "customers">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${customer.name}`}
        disabled={busyCustomerId === customer._id}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(customer)}>
          <Eye className="size-4" />
          View Customer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewOrders(customer)}>
          <ShoppingBag className="size-4" />
          View Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(customer)}>
          <Pencil className="size-4" />
          Edit Customer
        </DropdownMenuItem>
        {customer.status === "active" ? (
          <DropdownMenuItem variant="destructive" onClick={() => onDisable(customer)}>
            <Ban className="size-4" />
            Disable Customer
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onEnable(customer)}>
            <CheckCircle2 className="size-4" />
            Enable Customer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Customers table — full table on desktop, stacked cards below `md` so nothing breaks on mobile. */
function CustomersTable({ customers, ...actions }: CustomersTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[960px] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 text-left">Customer</th>
              <th className="px-3 py-2.5 text-left">Email</th>
              <th className="px-3 py-2.5 text-left">Orders</th>
              <th className="px-3 py-2.5 text-left">Total Spent</th>
              <th className="px-3 py-2.5 text-left">Last Order</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-left">Joined</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer._id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={customerAvatar(customer)}
                      alt={customer.name}
                      className="size-9 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{customer.name}</p>
                      <p className="text-caption text-muted-foreground">{shortCustomerId(customer._id)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{customer.email}</td>
                <td className="px-3 py-3 text-foreground">{customer.ordersCount}</td>
                <td className="px-3 py-3 font-medium text-foreground">{formatPrice(customer.totalSpent)}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {customer.lastOrderDate ? formatCustomerDate(customer.lastOrderDate) : "—"}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={statusBadgeVariant[customer.status]}>{statusLabel[customer.status]}</Badge>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatCustomerDate(customer.createdAt)}</td>
                <td className="px-3 py-3 text-right">
                  <ActionsMenu customer={customer} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {customers.map((customer) => (
          <div key={customer._id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={customerAvatar(customer)}
                alt={customer.name}
                className="size-11 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-foreground">{customer.name}</p>
                <p className="text-caption text-muted-foreground">{shortCustomerId(customer._id)}</p>
                <p className="truncate text-caption text-muted-foreground">{customer.email}</p>
              </div>
              <ActionsMenu customer={customer} {...actions} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-small">
              <div>
                <span className="block text-caption text-muted-foreground">Orders</span>
                {customer.ordersCount}
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Total Spent</span>
                <span className="font-medium text-foreground">{formatPrice(customer.totalSpent)}</span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Last Order</span>
                {customer.lastOrderDate ? formatCustomerDate(customer.lastOrderDate) : "—"}
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Joined</span>
                {formatCustomerDate(customer.createdAt)}
              </div>
            </div>

            <div className="mt-2.5">
              <Badge variant={statusBadgeVariant[customer.status]}>{statusLabel[customer.status]}</Badge>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export { CustomersTable }
