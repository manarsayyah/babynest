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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import type { AdminCustomerRow } from "@/lib/api-client/admin-customers"

export type CustomerFormValues = { firstName: string; lastName: string; email: string }

export type CustomerSaveOutcome =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export type CustomerFormDialogProps = {
  customer: AdminCustomerRow | null
  onClose: () => void
  onSave: (values: CustomerFormValues, customer: AdminCustomerRow) => Promise<CustomerSaveOutcome>
}

type Errors = Record<string, string>

function CustomerForm({
  customer,
  onCancel,
  onSave,
}: {
  customer: AdminCustomerRow
  onCancel: () => void
  onSave: CustomerFormDialogProps["onSave"]
}) {
  const [firstName, setFirstName] = React.useState(customer.firstName)
  const [lastName, setLastName] = React.useState(customer.lastName)
  const [email, setEmail] = React.useState(customer.email)
  const [errors, setErrors] = React.useState<Errors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: Errors = {}
    if (!firstName.trim()) nextErrors.firstName = "First name is required."
    if (!lastName.trim()) nextErrors.lastName = "Last name is required."
    if (!email.trim()) nextErrors.email = "Email is required."
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Enter a valid email address."
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      const outcome = await onSave({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() }, customer)
      if (!outcome.ok) {
        setFormError(outcome.message)
        setErrors(outcome.fieldErrors ?? {})
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogDescription>Update this customer&apos;s name and email address.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-first-name">First Name</Label>
            <Input
              id="customer-first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={Boolean(errors.firstName)}
            />
            <FormError message={errors.firstName} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-last-name">Last Name</Label>
            <Input
              id="customer-last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={Boolean(errors.lastName)}
            />
            <FormError message={errors.lastName} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="customer-email">Email</Label>
          <Input
            id="customer-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          <FormError message={errors.email} />
        </div>
      </div>

      <FormError message={formError} className="mb-2" />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Edit Customer dialog (name + email) — reuses the project's existing Dialog primitive. */
function CustomerFormDialog({ customer, onClose, onSave }: CustomerFormDialogProps) {
  return (
    <Dialog
      open={customer !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {customer ? <CustomerForm key={customer._id} customer={customer} onCancel={onClose} onSave={onSave} /> : null}
      </DialogContent>
    </Dialog>
  )
}

export { CustomerFormDialog }
