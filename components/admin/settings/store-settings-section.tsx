"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { timezoneOptions, type StoreSettings } from "@/lib/mock/admin-settings"

export type StoreSettingsSectionProps = {
  value: StoreSettings
  onSave: (next: StoreSettings) => void
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-small font-medium text-foreground">{title}</p>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  )
}

/** "Store Settings" — currency/timezone/order & inventory toggles/low-stock threshold, draft-until-saved. */
function StoreSettingsSection({ value, onSave }: StoreSettingsSectionProps) {
  const [draft, setDraft] = React.useState(value)

  function update<K extends keyof StoreSettings>(key: K, next: StoreSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: next }))
  }

  function handleSave() {
    const threshold = Math.max(0, Math.round(draft.lowStockThreshold) || 0)
    onSave({ ...draft, lowStockThreshold: threshold })
    toast.success("Settings saved successfully.")
  }

  function handleCancel() {
    setDraft(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Store Settings</CardTitle>
        <p className="text-caption text-muted-foreground">Currency, timezone, and order/inventory behavior</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-currency">Currency</Label>
            <Select value="USD" onValueChange={() => {}} disabled>
              <SelectTrigger id="store-currency" className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">Additional currencies aren&apos;t supported yet.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-timezone">Timezone</Label>
            <Select value={draft.timezone} onValueChange={(v) => update("timezone", v ?? draft.timezone)}>
              <SelectTrigger id="store-timezone" className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezoneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
            <Input
              id="low-stock-threshold"
              type="number"
              min={0}
              value={draft.lowStockThreshold}
              onChange={(e) => update("lowStockThreshold", Number(e.target.value))}
            />
            <p className="text-caption text-muted-foreground">Units remaining before a product is flagged as low stock.</p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          <ToggleRow
            title="Order Processing"
            description="Allow new orders to be placed and processed."
            checked={draft.orderProcessingEnabled}
            onCheckedChange={(checked) => update("orderProcessingEnabled", checked)}
          />
          <ToggleRow
            title="Inventory Tracking"
            description="Automatically track stock levels as orders come in."
            checked={draft.inventoryTrackingEnabled}
            onCheckedChange={(checked) => update("inventoryTrackingEnabled", checked)}
          />
          <ToggleRow
            title="Out of Stock Notifications"
            description="Notify the team when a product's stock reaches zero."
            checked={draft.outOfStockNotifications}
            onCheckedChange={(checked) => update("outOfStockNotifications", checked)}
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

export { StoreSettingsSection }
