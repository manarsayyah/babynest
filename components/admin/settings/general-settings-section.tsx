"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormError } from "@/components/ui/form-error"
import type { GeneralSettings } from "@/lib/mock/admin-settings"

export type GeneralSettingsSectionProps = {
  value: GeneralSettings
  onSave: (next: GeneralSettings) => void
}

type Errors = Partial<Record<keyof GeneralSettings, string>>

/** "General Settings" — store identity fields, draft-until-saved. */
function GeneralSettingsSection({ value, onSave }: GeneralSettingsSectionProps) {
  const [draft, setDraft] = React.useState(value)
  const [errors, setErrors] = React.useState<Errors>({})

  function update<K extends keyof GeneralSettings>(key: K, next: GeneralSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: next }))
  }

  function handleSave() {
    const nextErrors: Errors = {}
    if (!draft.storeName.trim()) nextErrors.storeName = "Store name is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.storeEmail.trim())) {
      nextErrors.storeEmail = "Enter a valid email address."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave(draft)
    toast.success("Settings saved successfully.")
  }

  function handleCancel() {
    setDraft(value)
    setErrors({})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">General Settings</CardTitle>
        <p className="text-caption text-muted-foreground">Your store&apos;s basic identity and contact details</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-name">Store Name</Label>
            <Input
              id="store-name"
              value={draft.storeName}
              onChange={(e) => update("storeName", e.target.value)}
              aria-invalid={Boolean(errors.storeName)}
            />
            <FormError message={errors.storeName} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-email">Store Email</Label>
            <Input
              id="store-email"
              type="email"
              value={draft.storeEmail}
              onChange={(e) => update("storeEmail", e.target.value)}
              aria-invalid={Boolean(errors.storeEmail)}
            />
            <FormError message={errors.storeEmail} />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="store-phone">Store Phone</Label>
            <Input
              id="store-phone"
              type="tel"
              value={draft.storePhone}
              onChange={(e) => update("storePhone", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-description">Store Description</Label>
          <Textarea
            id="store-description"
            rows={3}
            value={draft.storeDescription}
            onChange={(e) => update("storeDescription", e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { GeneralSettingsSection }
