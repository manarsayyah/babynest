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
import { Checkbox } from "@/components/ui/checkbox"
import { FormError } from "@/components/ui/form-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addressLabelOptions, emptyAddressDraft, type AddressDraft, type SavedAddress } from "@/lib/api-client/addresses"

export type AddressFormState = { mode: "add" } | { mode: "edit"; address: SavedAddress }

export type AddressFormDialogProps = {
  state: AddressFormState | null
  onClose: () => void
  /** Resolves true once the server accepted the change (dialog then closes); false keeps it open for a retry. */
  onSave: (draft: AddressDraft, state: AddressFormState) => Promise<boolean>
}

type Errors = Partial<Record<"fullName" | "phone" | "street" | "city" | "country", string>>

function AddressForm({
  state,
  onCancel,
  onSave,
}: {
  state: AddressFormState
  onCancel: () => void
  onSave: (draft: AddressDraft) => Promise<void>
}) {
  const initial = state.mode === "edit" ? state.address : emptyAddressDraft
  const [draft, setDraft] = React.useState<AddressDraft>(initial)
  const [errors, setErrors] = React.useState<Errors>({})
  const [isSaving, setIsSaving] = React.useState(false)

  function update<K extends keyof AddressDraft>(key: K, value: AddressDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors: Errors = {}
    if (!draft.fullName.trim()) nextErrors.fullName = "Full name is required."
    if (!draft.phone.trim()) nextErrors.phone = "Phone number is required."
    if (!draft.street.trim()) nextErrors.street = "Street address is required."
    if (!draft.city.trim()) nextErrors.city = "City is required."
    if (!draft.country.trim()) nextErrors.country = "Country is required."
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      await onSave(draft)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{state.mode === "edit" ? "Edit Address" : "Add New Address"}</DialogTitle>
        <DialogDescription>
          {state.mode === "edit"
            ? "Update the details for this delivery address."
            : "Save a new delivery address to your account."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-label">Address Label</Label>
          <Select value={draft.label} onValueChange={(v) => update("label", (v as AddressDraft["label"]) ?? draft.label)}>
            <SelectTrigger id="address-label" className="w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {addressLabelOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-full-name">Full Name</Label>
          <Input
            id="address-full-name"
            value={draft.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
          />
          <FormError message={errors.fullName} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-phone">Phone Number</Label>
          <Input
            id="address-phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={draft.phone}
            onChange={(e) => update("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
          />
          <FormError message={errors.phone} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-street">Street Address</Label>
          <Input
            id="address-street"
            placeholder="123 Main Street"
            value={draft.street}
            onChange={(e) => update("street", e.target.value)}
            aria-invalid={Boolean(errors.street)}
          />
          <FormError message={errors.street} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address-apartment">Apartment / Building / Floor (optional)</Label>
          <Input
            id="address-apartment"
            value={draft.apartment}
            onChange={(e) => update("apartment", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-city">City</Label>
            <Input
              id="address-city"
              value={draft.city}
              onChange={(e) => update("city", e.target.value)}
              aria-invalid={Boolean(errors.city)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-state">State / Region (optional)</Label>
            <Input
              id="address-state"
              value={draft.state}
              onChange={(e) => update("state", e.target.value)}
            />
          </div>
        </div>
        <FormError message={errors.city} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-country">Country</Label>
            <Input
              id="address-country"
              value={draft.country}
              onChange={(e) => update("country", e.target.value)}
              aria-invalid={Boolean(errors.country)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address-postal">Postal Code (optional)</Label>
            <Input
              id="address-postal"
              value={draft.postalCode}
              onChange={(e) => update("postalCode", e.target.value)}
            />
          </div>
        </div>
        <FormError message={errors.country} />

        <label className="flex cursor-pointer items-center gap-2.5">
          <Checkbox
            checked={draft.isDefault}
            onCheckedChange={(checked) => update("isDefault", checked === true)}
          />
          <span className="text-small text-muted-foreground">Set as default address</span>
        </label>
      </div>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>{state.mode === "edit" ? "Save Changes" : "Save Address"}</Button>
      </DialogFooter>
    </form>
  )
}

/** Add/Edit Address dialog — reuses the project's existing Dialog primitive. */
function AddressFormDialog({ state, onClose, onSave }: AddressFormDialogProps) {
  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {state ? (
          <AddressForm
            key={state.mode === "edit" ? state.address.id : "add"}
            state={state}
            onCancel={onClose}
            onSave={async (draft) => {
              await onSave(draft, state)
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { AddressFormDialog }
