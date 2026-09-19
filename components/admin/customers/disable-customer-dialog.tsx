"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AdminCustomerRow } from "@/lib/api-client/admin-customers"

export type DisableCustomerDialogProps = {
  customer: AdminCustomerRow | null
  onClose: () => void
  /** Performs the real (soft-delete) request; the dialog stays open and shows a busy state until it settles. */
  onConfirm: (customer: AdminCustomerRow) => Promise<void>
}

/** "Are you sure you want to disable this customer?" — mirrors the Orders/Products confirm pattern. */
function DisableCustomerDialog({ customer, onClose, onConfirm }: DisableCustomerDialogProps) {
  const [isDisabling, setIsDisabling] = React.useState(false)

  async function handleConfirm() {
    if (!customer) return
    setIsDisabling(true)
    try {
      await onConfirm(customer)
    } finally {
      setIsDisabling(false)
    }
  }

  return (
    <Dialog
      open={customer !== null}
      onOpenChange={(open) => {
        if (!open && !isDisabling) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable this customer?</DialogTitle>
          <DialogDescription>
            {customer ? `${customer.name}'s account will be marked inactive and no longer counted as an active customer.` : null}{" "}
            Their orders and data are kept, and you can re-enable the account at any time.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isDisabling}>
            Keep Active
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleConfirm()}
            disabled={isDisabling}
          >
            {isDisabling ? "Disabling..." : "Disable Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DisableCustomerDialog }
