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
import type { AdminProductRow } from "@/lib/api-client/admin-products"

export type DeleteProductDialogProps = {
  product: AdminProductRow | null
  onClose: () => void
  /** Performs the real (soft) delete request; the dialog stays open and shows a busy state until it settles. */
  onConfirm: (product: AdminProductRow) => Promise<void>
}

/** "Are you sure you want to delete this product?" — mirrors the cancel-order confirm pattern. */
function DeleteProductDialog({ product, onClose, onConfirm }: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleConfirm() {
    if (!product) return
    setIsDeleting(true)
    try {
      await onConfirm(product)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog
      open={product !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this product?</DialogTitle>
          <DialogDescription>
            {product ? `"${product.name}" will be removed from your catalog.` : null} It will no longer appear
            in the store or in this list.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Keep Product
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteProductDialog }
