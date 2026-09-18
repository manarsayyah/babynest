"use client"

import * as React from "react"
import { PowerOff, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DangerActionDialog } from "@/components/admin/settings/danger-action-dialog"

type PendingAction = "disable" | "delete" | null

/** "Danger Zone" — clearly separated but kept visually quiet; both actions require confirmation and are not wired up yet. */
function DangerZoneSection() {
  const [pendingAction, setPendingAction] = React.useState<PendingAction>(null)

  return (
    <>
      <div className="rounded-xl border border-destructive/30 bg-card p-5">
        <h2 className="text-small font-semibold text-destructive">Danger Zone</h2>
        <p className="mt-0.5 text-caption text-muted-foreground">
          These actions affect your entire store. Proceed with caution.
        </p>

        <div className="mt-4 flex flex-col divide-y divide-border">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
            <div>
              <p className="text-small font-medium text-foreground">Disable Store</p>
              <p className="text-caption text-muted-foreground">Temporarily take the storefront offline for customers.</p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setPendingAction("disable")}
            >
              <PowerOff data-icon="inline-start" />
              Disable Store
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
            <div>
              <p className="text-small font-medium text-foreground">Delete Account / Store</p>
              <p className="text-caption text-muted-foreground">Permanently delete this store and all of its data.</p>
            </div>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setPendingAction("delete")}
            >
              <Trash2 data-icon="inline-start" />
              Delete Store
            </Button>
          </div>
        </div>
      </div>

      <DangerActionDialog
        open={pendingAction === "disable"}
        title="Disable your store?"
        description="Your storefront will stop accepting new orders until you re-enable it. Existing orders won't be affected."
        confirmLabel="Disable Store"
        successMessage="The store"
        onClose={() => setPendingAction(null)}
      />

      <DangerActionDialog
        open={pendingAction === "delete"}
        title="Delete this store?"
        description="This will permanently delete your store, products, orders, and customer data. This can't be undone."
        confirmLabel="Delete Store"
        successMessage="The store"
        onClose={() => setPendingAction(null)}
      />
    </>
  )
}

export { DangerZoneSection }
