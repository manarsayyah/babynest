"use client"

import { MoreVertical, Pencil, Power, PowerOff, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  describeDiscount,
  formatPromotionDate,
  promotionLifecycle,
  type AdminPromotionRow,
  type PromotionLifecycle,
} from "@/lib/api-client/admin-promotions"

const lifecycleBadgeVariant: Record<PromotionLifecycle, "success" | "ai" | "outline" | "destructive"> = {
  live: "success",
  upcoming: "ai",
  inactive: "outline",
  expired: "destructive",
}

const lifecycleLabel: Record<PromotionLifecycle, string> = {
  live: "Live",
  upcoming: "Upcoming",
  inactive: "Inactive",
  expired: "Expired",
}

export type PromotionsTableProps = {
  promotions: AdminPromotionRow[]
  onEdit: (promotion: AdminPromotionRow) => void
  onDelete: (promotion: AdminPromotionRow) => void
  onToggleActive: (promotion: AdminPromotionRow) => void
  /** Id of a promotion with a request in flight — its actions are disabled until it settles. */
  busyPromotionId?: string | null
}

function ActionsMenu({
  promotion,
  onEdit,
  onDelete,
  onToggleActive,
  busyPromotionId,
}: { promotion: AdminPromotionRow } & Omit<PromotionsTableProps, "promotions">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${promotion.code}`}
        disabled={busyPromotionId === promotion._id}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground"
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(promotion)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onToggleActive(promotion)}>
          {promotion.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
          {promotion.isActive ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(promotion)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Promotions table — full table on desktop, stacked cards below `md` so nothing breaks on mobile (mirrors ProductsTable). */
function PromotionsTable({ promotions, ...actions }: PromotionsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] border-collapse text-small">
          <thead>
            <tr className="border-b border-border text-caption font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="px-3 py-2.5 text-left">Code</th>
              <th className="px-3 py-2.5 text-left">Discount</th>
              <th className="px-3 py-2.5 text-left">Start</th>
              <th className="px-3 py-2.5 text-left">End</th>
              <th className="px-3 py-2.5 text-left">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promotion) => {
              const lifecycle = promotionLifecycle(promotion)
              return (
                <tr key={promotion._id} className="border-b border-border transition-colors last:border-0 hover:bg-muted/50">
                  <td className="px-3 py-3">
                    <p className="font-mono font-medium text-foreground">{promotion.code}</p>
                    {promotion.description ? (
                      <p className="max-w-64 truncate text-caption text-muted-foreground">{promotion.description}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">{describeDiscount(promotion)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatPromotionDate(promotion.startDate)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatPromotionDate(promotion.endDate)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={lifecycleBadgeVariant[lifecycle]}>{lifecycleLabel[lifecycle]}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <ActionsMenu promotion={promotion} {...actions} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {promotions.map((promotion) => {
          const lifecycle = promotionLifecycle(promotion)
          return (
            <div key={promotion._id} className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-small font-medium text-foreground">{promotion.code}</p>
                  {promotion.description ? (
                    <p className="truncate text-caption text-muted-foreground">{promotion.description}</p>
                  ) : null}
                </div>
                <ActionsMenu promotion={promotion} {...actions} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-y-2.5 text-small">
                <div>
                  <span className="block text-caption text-muted-foreground">Discount</span>
                  <span className="font-medium text-foreground">{describeDiscount(promotion)}</span>
                </div>
                <div>
                  <span className="block text-caption text-muted-foreground">Status</span>
                  <Badge variant={lifecycleBadgeVariant[lifecycle]}>{lifecycleLabel[lifecycle]}</Badge>
                </div>
                <div>
                  <span className="block text-caption text-muted-foreground">Start</span>
                  {formatPromotionDate(promotion.startDate)}
                </div>
                <div>
                  <span className="block text-caption text-muted-foreground">End</span>
                  {formatPromotionDate(promotion.endDate)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export { PromotionsTable }
