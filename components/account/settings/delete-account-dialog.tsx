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

export type DeleteAccountDialogProps = {
  open: boolean
  onClose: () => void
}

/** "Are you sure you want to delete your account?" — no backend exists, so confirming only shows a toast; nothing is actually deleted. */
function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogDescription>
            This will permanently remove your BabyNest profile, orders, addresses, and saved items. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Keep My Account
          </Button>
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => {
              onClose()
              toast("Account deletion isn't wired up yet", {
                description: "This is a frontend-only demo — nothing was actually deleted.",
              })
            }}
          >
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { DeleteAccountDialog }
