"use client"

import { Eye, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  formatReturnDate,
  nextReturnStatuses,
  returnStatusLabel,
  type AdminReturnRow,
  type ReturnStatus,
} from "@/lib/api-client/admin-returns"

const statusBadgeVariant: Record<ReturnStatus, "warning" | "ai" | "success" | "destructive"> = {
  requested: "warning",
  approved: "ai",
  completed: "success",
  rejected: "destructive",
}

/** Order number + customer name for a return's order — fetched separately per row since the returns list
 * endpoint doesn't join them (see fetchAdminOrderDetail in the page content). */
export type ReturnOrderInfo = { orderNumber: string; customerName: string; customerEmail: string }

export type ReturnsTableProps = {
  returns: AdminReturnRow[]
  /** Keyed by orderId: an object once fetched, `null` if that lookup failed, absent while still loading. */
  orderInfoByOrderId: Record<string, ReturnOrderInfo | null>
  onView: (returnRow: AdminReturnRow) => void
  onUpdateStatus: (returnRow: AdminReturnRow, status: ReturnStatus) => void
  /** Id of a return with a request in flight — its actions are disabled until it settles. */
  busyReturnId?: string | null
}

function OrderCell({ orderId, info }: { orderId: string; info: ReturnOrderInfo | null | undefined }) {
  if (info) {
    return (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{info.orderNumber}</p>
        <p className="truncate text-caption text-muted-foreground">{info.customerName}</p>
      </div>
    )
  }
  if (info === undefined) return <Skeleton className="h-9 w-32 rounded" />
  return <span className="text-muted-foreground">Order {orderId.slice(-6)}</span>
}

function ActionsMenu({
  returnRow,
  onView,
  onUpdateStatus,
  busyReturnId,
}: { returnRow: AdminReturnRow } & Omit<ReturnsTableProps, "returns" | "orderInfoByOrderId">) {
  const nextStatuses = nextReturnStatuses(returnRow.status)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for return ${returnRow._id.slice(-6)}`}
        disabled={busyReturnId === returnRow._id}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onView(returnRow)}>
          <Eye className="size-4" />
          View Details
        </DropdownMenuItem>
        {nextStatuses.map((status) => (
          <DropdownMenuItem
            key={status}
            variant={status === "rejected" ? "destructive" : "default"}
            onClick={() => onUpdateStatus(returnRow, status)}
          >
            Mark as {returnStatusLabel[status]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Returns table — full table on desktop, stacked cards below `md` (mirrors ProductsTable / OrdersTable). */
function ReturnsTable({ returns, orderInfoByOrderId, ...actions }: ReturnsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 text-left">Order / Customer</th>
              <th className="px-3 py-2.5 text-left">Reason</th>
              <th className="px-3 py-2.5 text-left">Requested</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((returnRow) => (
              <tr key={returnRow._id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                <td className="px-3 py-3">
                  <OrderCell orderId={returnRow.orderId} info={orderInfoByOrderId[returnRow.orderId]} />
                </td>
                <td className="max-w-64 truncate px-3 py-3 text-muted-foreground">{returnRow.reason}</td>
                <td className="px-3 py-3 text-muted-foreground">{formatReturnDate(returnRow.requestedAt)}</td>
                <td className="px-3 py-3">
                  <Badge variant={statusBadgeVariant[returnRow.status]}>{returnStatusLabel[returnRow.status]}</Badge>
                </td>
                <td className="px-3 py-3 text-right">
                  <ActionsMenu returnRow={returnRow} {...actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {returns.map((returnRow) => (
          <div key={returnRow._id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <OrderCell orderId={returnRow.orderId} info={orderInfoByOrderId[returnRow.orderId]} />
              <ActionsMenu returnRow={returnRow} {...actions} />
            </div>

            <p className="mt-2.5 line-clamp-2 text-small text-muted-foreground">{returnRow.reason}</p>

            <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-small">
              <div>
                <span className="block text-caption text-muted-foreground">Requested</span>
                {formatReturnDate(returnRow.requestedAt)}
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Status</span>
                <Badge variant={statusBadgeVariant[returnRow.status]}>{returnStatusLabel[returnRow.status]}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export { ReturnsTable }
