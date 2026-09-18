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

export type DangerActionDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  successMessage: string
  onClose: () => void
}

/** Generic destructive-action confirm dialog, reused for both "Disable Store" and "Delete Store". */
function DangerActionDialog({ open, title, description, confirmLabel, successMessage, onClose }: DangerActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              onClose()
              toast(`${confirmLabel} isn't wired up yet`, {
                description: `This is a frontend-only demo — ${successMessage.toLowerCase()} was not actually performed.`,
              })
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DangerActionDialog }
