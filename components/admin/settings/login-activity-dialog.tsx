"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { mockLoginActivity } from "@/lib/mock/admin-settings"

export type LoginActivityDialogProps = {
  open: boolean
  onClose: () => void
}

/** Read-only preview of recent sign-ins — illustrative only, not backed by a real session store yet. */
function LoginActivityDialog({ open, onClose }: LoginActivityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login Activity</DialogTitle>
          <DialogDescription>A preview of what recent sign-in activity will look like once session tracking is connected.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-border">
          {mockLoginActivity.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-small font-medium text-foreground">{entry.device}</p>
                <p className="text-caption text-muted-foreground">{entry.location} · {entry.date}</p>
              </div>
              {entry.current ? <Badge variant="success">This device</Badge> : null}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { LoginActivityDialog }
