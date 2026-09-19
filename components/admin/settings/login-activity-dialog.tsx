"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { AdminSettings } from "@/lib/api-client/admin-settings"

export type LoginActivityDialogProps = {
  open: boolean
  account: AdminSettings["account"]
  session: AdminSettings["session"]
  onClose: () => void
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })

/** Real details of the current session (from the server-verified sign-in). Per-device history isn't tracked, so none is shown. */
function LoginActivityDialog({ open, account, session, onClose }: LoginActivityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login Activity</DialogTitle>
          <DialogDescription>
            The session you&apos;re signed in with. A history of past sign-ins and other devices isn&apos;t recorded yet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-small font-medium text-foreground">
                {account.firstName} {account.lastName}
              </p>
              <p className="truncate text-caption text-muted-foreground">
                {account.email} · <span className="capitalize">{account.role}</span>
              </p>
              <p className="text-caption text-muted-foreground">Session expires {formatDateTime(session.expiresAt)}</p>
            </div>
            <Badge variant="success">This session</Badge>
          </div>
          <div className="py-2.5 last:pb-0">
            <p className="text-caption text-muted-foreground">Account created {formatDateTime(account.createdAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { LoginActivityDialog }
