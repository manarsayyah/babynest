"use client"

import * as React from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { changeAdminPassword } from "@/lib/api-client/admin-settings"
import { ApiRequestError } from "@/lib/api-client/fetcher"

export type ChangePasswordDialogProps = {
  open: boolean
  onClose: () => void
}

type Errors = Partial<Record<"currentPassword" | "newPassword" | "confirmPassword", string>>

/** Flattens the server's `{ field: string[] }` validation details into one message per field. */
function fieldErrorsFromDetails(details: unknown): Errors {
  if (!details || typeof details !== "object") return {}
  const result: Errors = {}
  for (const [field, messages] of Object.entries(details as Record<string, unknown>)) {
    if ((field === "currentPassword" || field === "newPassword") && Array.isArray(messages) && typeof messages[0] === "string") {
      result[field] = messages[0]
    }
  }
  return result
}

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [errors, setErrors] = React.useState<Errors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: Errors = {}
    if (!currentPassword) nextErrors.currentPassword = "Enter your current password."
    if (newPassword.length < 8) nextErrors.newPassword = "New password must be at least 8 characters."
    else if (newPassword.length > 72) nextErrors.newPassword = "New password must be at most 72 characters."
    else if (newPassword === currentPassword) nextErrors.newPassword = "New password must be different from the current password."
    if (confirmPassword !== newPassword) nextErrors.confirmPassword = "Passwords don't match."
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      await changeAdminPassword({ currentPassword, newPassword })
      // Success is only announced after the server has actually saved the new password.
      toast.success("Password changed", { description: "Use your new password the next time you sign in." })
      onClose()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const fieldErrors = fieldErrorsFromDetails(err.details)
        setErrors(fieldErrors)
        setFormError(
          err.status === 401
            ? "Your session has expired. Please sign in again."
            : err.status === 403
              ? "You don't have permission to change this password."
              : err.status < 500 && Object.keys(fieldErrors).length === 0
                ? err.message
                : err.status >= 500
                  ? "Couldn't change the password. Please try again."
                  : null
        )
      } else {
        setFormError("Couldn't change the password. Please check your connection and try again.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>Enter your current password, then choose a new one (8–72 characters).</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={Boolean(errors.currentPassword)}
          />
          <FormError message={errors.currentPassword} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(errors.newPassword)}
          />
          <FormError message={errors.newPassword} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          <FormError message={errors.confirmPassword} />
        </div>
      </div>

      <FormError message={formError} className="mb-2" />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Change Password"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Change-password dialog — reuses the project's Dialog primitive; the form remounts (fields cleared) every time it opens. */
function ChangePasswordDialog({ open, onClose }: ChangePasswordDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">{open ? <ChangePasswordForm onClose={onClose} /> : null}</DialogContent>
    </Dialog>
  )
}

export { ChangePasswordDialog }
