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
import type { SavedAddress } from "@/lib/api-client/addresses"

export type DeleteAddressDialogProps = {
  address: SavedAddress | null
  onClose: () => void
  /** Resolves once the server has deleted it; the page owns the success/failure toast. */
  onConfirm: (addressId: string) => Promise<void>
}

/** "Are you sure you want to delete this address?" — mirrors the project's other confirm-before-delete dialogs. */
function DeleteAddressDialog({ address, onClose, onConfirm }: DeleteAddressDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  return (
    <Dialog
      open={address !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this address?</DialogTitle>
          <DialogDescription>
            {address ? `Your "${address.label}" address will be removed from your account.` : null} This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Keep Address
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={isDeleting}
            onClick={async () => {
              if (!address) return
              setIsDeleting(true)
              try {
                await onConfirm(address.id)
              } finally {
                setIsDeleting(false)
              }
            }}
          >
            Delete Address
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteAddressDialog }
