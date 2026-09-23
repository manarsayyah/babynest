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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/ui/form-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  draftFromPromotion,
  emptyPromotionDraft,
  type AdminPromotionRow,
  type DiscountType,
  type PromotionDraft,
} from "@/lib/api-client/admin-promotions"

export type PromotionFormState = { mode: "add" } | { mode: "edit"; promotion: AdminPromotionRow }

export type PromotionSaveOutcome =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }

export type PromotionFormDialogProps = {
  state: PromotionFormState | null
  onClose: () => void
  onSave: (draft: PromotionDraft, state: PromotionFormState) => Promise<PromotionSaveOutcome>
}

type FormErrors = Record<string, string>

const discountTypeOptions: { value: DiscountType; label: string }[] = [
  { value: "percentage", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
]

/** Matches the server's own rules (lib/validation/promotion.ts) so the form fails fast, before the request. */
function validate(draft: PromotionDraft): FormErrors {
  const errors: FormErrors = {}

  if (!draft.code.trim()) errors.code = "Code is required."

  const value = Number(draft.discountValue)
  if (draft.discountValue.trim() === "" || !Number.isFinite(value) || value <= 0) {
    errors.discountValue = "Discount value must be greater than 0."
  } else if (draft.discountType === "percentage" && value > 100) {
    errors.discountValue = "A percentage discount cannot exceed 100."
  }

  if (!draft.startDate) errors.startDate = "Start date is required."
  if (!draft.endDate) errors.endDate = "End date is required."
  if (draft.startDate && draft.endDate && new Date(draft.endDate) <= new Date(draft.startDate)) {
    errors.endDate = "End date must be after the start date."
  }

  return errors
}

/** Add/Edit Promotion form — same fields render for both, keyed by the caller so state resets per promotion. */
function PromotionForm({
  state,
  onCancel,
  onSave,
}: {
  state: PromotionFormState
  onCancel: () => void
  onSave: PromotionFormDialogProps["onSave"]
}) {
  const initial = state.mode === "edit" ? draftFromPromotion(state.promotion) : emptyPromotionDraft
  const [draft, setDraft] = React.useState<PromotionDraft>(initial)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  function update<K extends keyof PromotionDraft>(key: K, value: PromotionDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nextErrors = validate(draft)
    setErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)
    try {
      const outcome = await onSave(draft, state)
      if (!outcome.ok) {
        setFormError(outcome.message)
        setErrors(outcome.fieldErrors ?? {})
      }
    } finally {
      setIsSaving(false)
    }
  }

  const isEdit = state.mode === "edit"

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Promotion" : "Add Promotion"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update this promo code's discount and availability window."
            : "Create a new promo code customers can apply at checkout."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto py-4 pr-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promotion-code">Promo Code</Label>
          <Input
            id="promotion-code"
            placeholder="e.g. WELCOME10"
            value={draft.code}
            onChange={(e) => update("code", e.target.value)}
            aria-invalid={Boolean(errors.code)}
            className="font-mono uppercase"
          />
          <FormError message={errors.code} />
          <p className="text-caption text-muted-foreground">Stored in uppercase, regardless of how it&apos;s typed here.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="promotion-description">Description</Label>
          <Textarea
            id="promotion-description"
            placeholder="Optional internal note, e.g. Welcome offer for new customers"
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promotion-discount-type">Discount Type</Label>
            <Select
              value={draft.discountType}
              items={discountTypeOptions}
              onValueChange={(value) => update("discountType", (value as DiscountType) ?? draft.discountType)}
            >
              <SelectTrigger id="promotion-discount-type" className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {discountTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promotion-discount-value">
              {draft.discountType === "percentage" ? "Discount (%)" : "Discount ($)"}
            </Label>
            <Input
              id="promotion-discount-value"
              type="number"
              min="0"
              max={draft.discountType === "percentage" ? 100 : undefined}
              step="0.01"
              inputMode="decimal"
              placeholder={draft.discountType === "percentage" ? "e.g. 15" : "e.g. 5.00"}
              value={draft.discountValue}
              onChange={(e) => update("discountValue", e.target.value)}
              aria-invalid={Boolean(errors.discountValue)}
            />
            <FormError message={errors.discountValue} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promotion-start-date">Start Date</Label>
            <Input
              id="promotion-start-date"
              type="date"
              value={draft.startDate}
              onChange={(e) => update("startDate", e.target.value)}
              aria-invalid={Boolean(errors.startDate)}
            />
            <FormError message={errors.startDate} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="promotion-end-date">End Date</Label>
            <Input
              id="promotion-end-date"
              type="date"
              value={draft.endDate}
              onChange={(e) => update("endDate", e.target.value)}
              aria-invalid={Boolean(errors.endDate)}
            />
            <FormError message={errors.endDate} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex flex-col">
            <Label htmlFor="promotion-active">Active</Label>
            <p className="text-caption text-muted-foreground">Inactive codes are rejected at checkout.</p>
          </div>
          <Switch id="promotion-active" checked={draft.isActive} onCheckedChange={(checked) => update("isActive", checked)} />
        </div>
      </div>

      <FormError message={formError} className="mb-2" />

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Add Promotion"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Add/Edit Promotion dialog — reuses the project's existing Dialog primitive, no duplicate modal system. */
function PromotionFormDialog({ state, onClose, onSave }: PromotionFormDialogProps) {
  return (
    <Dialog
      open={state !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        {state ? (
          <PromotionForm
            key={state.mode === "edit" ? state.promotion._id : "add"}
            state={state}
            onCancel={onClose}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export { PromotionFormDialog }
