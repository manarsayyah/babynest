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
import type { AdminCategoryRow } from "@/lib/api-client/admin-categories"

export type DisableCategoryDialogProps = {
  category: AdminCategoryRow | null
  onClose: () => void
  /** Performs the real status update; the dialog stays open and shows a busy state until it settles. */
  onConfirm: (category: AdminCategoryRow) => Promise<void>
}

/** "Are you sure you want to disable this category?" — mirrors the other Admin pages' confirm pattern. */
function DisableCategoryDialog({ category, onClose, onConfirm }: DisableCategoryDialogProps) {
  const [isDisabling, setIsDisabling] = React.useState(false)

  async function handleConfirm() {
    if (!category) return
    setIsDisabling(true)
    try {
      await onConfirm(category)
    } finally {
      setIsDisabling(false)
    }
  }

  return (
    <Dialog
      open={category !== null}
      onOpenChange={(open) => {
        if (!open && !isDisabling) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable this category?</DialogTitle>
          <DialogDescription>
            {category
              ? `"${category.name}" will be hidden from the storefront. Its ${category.productCount} ${
                  category.productCount === 1 ? "product" : "products"
                } will stay assigned.`
              : null}{" "}
            You can re-enable it at any time.
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
            {isDisabling ? "Disabling..." : "Disable Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DisableCategoryDialog }
