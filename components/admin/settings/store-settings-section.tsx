import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import type { AdminSettings } from "@/lib/api-client/admin-settings"

export type StoreSettingsSectionProps = {
  store: AdminSettings["store"]
}

const currencyLabels: Record<string, string> = { USD: "USD — US Dollar" }
const timezoneLabels: Record<string, string> = { UTC: "Coordinated Universal Time (UTC)" }

function ToggleRow({
  title,
  description,
  note,
  checked,
}: {
  title: string
  description: string
  note: string
  checked: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-small font-medium text-foreground">{title}</p>
        <p className="text-caption text-muted-foreground">{description}</p>
        <p className="text-caption text-muted-foreground">{note}</p>
      </div>
      <Switch checked={checked} disabled aria-label={title} />
    </div>
  )
}

/**
 * "Store Settings" — the values the application really runs on (currency, timezone, low-stock threshold, and the
 * always-on order/inventory behavior), shown read-only. There's no settings storage to save changes to, so every
 * control is disabled rather than pretending to persist.
 */
function StoreSettingsSection({ store }: StoreSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-h3">Store Settings</CardTitle>
          <Badge variant="outline">Read-only</Badge>
        </div>
        <p className="text-caption text-muted-foreground">Currency, timezone, and order/inventory behavior</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-caption text-muted-foreground">
          These are the values BabyNest currently runs on. They&apos;re fixed in the application for now — saving store
          settings needs storage the project doesn&apos;t have yet.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-currency">Currency</Label>
            <Select value={store.currency} disabled>
              <SelectTrigger id="store-currency" className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={store.currency}>{currencyLabels[store.currency] ?? store.currency}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">Cash on Delivery is the only payment method.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-timezone">Timezone</Label>
            <Select value={store.timezone} disabled>
              <SelectTrigger id="store-timezone" className="w-full rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={store.timezone}>{timezoneLabels[store.timezone] ?? store.timezone}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-caption text-muted-foreground">Reports and dashboards group dates in UTC.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
            <Input id="low-stock-threshold" type="number" value={store.lowStockThreshold} readOnly disabled />
            <p className="text-caption text-muted-foreground">
              Units remaining before a product is flagged as low stock (Products, Reports and AI Insights).
            </p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          <ToggleRow
            title="Order Processing"
            description="Allow new orders to be placed and processed."
            note="Always on — orders can't be paused yet."
            checked
          />
          <ToggleRow
            title="Inventory Tracking"
            description="Automatically track stock levels as orders come in."
            note="Always on — checkout always deducts variant stock."
            checked
          />
          <ToggleRow
            title="Out of Stock Notifications"
            description="Notify the team when a product's stock reaches zero."
            note="Not available yet — no notification of this kind exists."
            checked={false}
          />
        </div>

        <div className="flex gap-2">
          <Button disabled>Save Changes</Button>
          <Button variant="outline" disabled>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { StoreSettingsSection }
