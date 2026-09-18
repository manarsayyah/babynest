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
import type { AdminCategory } from "@/lib/mock/admin-categories"

export type DisableCategoryDialogProps = {
  category: AdminCategory | null
  onClose: () => void
  onConfirm: (categorySlug: string) => void
}

/** "Are you sure you want to disable this category?" — mirrors the other Admin pages' confirm pattern. */
function DisableCategoryDialog({ category, onClose, onConfirm }: DisableCategoryDialogProps) {
  return (
    <Dialog
      open={category !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
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
          <Button variant="secondary" onClick={onClose}>
            Keep Active
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (!category) return
              onConfirm(category.slug)
              toast.success("Category disabled", { description: `${category.name} has been disabled.` })
            }}
          >
            Disable Category
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DisableCategoryDialog }
