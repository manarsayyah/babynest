"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export type DangerActionDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onClose: () => void
}

/**
 * Confirm dialog for the Danger Zone actions. Neither action exists in the application (there's no store-wide
 * switch to save, and deleting a whole store is intentionally not supported), so the dialog explains that and the
 * destructive button is disabled — nothing is performed and no success is claimed.
 */
function DangerActionDialog({ open, title, description, confirmLabel, onClose }: DangerActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" className="border-destructive/40 text-destructive" disabled>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DangerActionDialog }
