"use client"

import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AdminCustomer } from "@/lib/mock/admin-customers"

export type DisableCustomerDialogProps = {
  customer: AdminCustomer | null
  onClose: () => void
  onConfirm: (customerId: string) => void
}

/** "Are you sure you want to disable this customer?" — mirrors the Orders/Products confirm pattern. */
function DisableCustomerDialog({ customer, onClose, onConfirm }: DisableCustomerDialogProps) {
  return (
    <Dialog
      open={customer !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable this customer?</DialogTitle>
          <DialogDescription>
            {customer ? `${customer.name} will no longer be able to sign in or place orders.` : null} You can
            re-enable their account at any time.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Keep Active
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (!customer) return
              onConfirm(customer.id)
              toast.success("Customer disabled", { description: `${customer.name} has been disabled.` })
            }}
          >
            Disable Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DisableCustomerDialog }
