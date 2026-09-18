"use client"

import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { notificationSettingsCopy, type NotificationSettings } from "@/lib/mock/admin-settings"

export type NotificationsSettingsSectionProps = {
  value: NotificationSettings
  onChange: (next: NotificationSettings) => void
}

/** "Notifications" — each preference applies instantly (no separate save step, matching the account settings pattern). */
function NotificationsSettingsSection({ value, onChange }: NotificationsSettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Notifications</CardTitle>
        <p className="text-caption text-muted-foreground">Choose what the admin team gets notified about</p>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        {notificationSettingsCopy.map(({ key, title, description }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-small font-medium text-foreground">{title}</p>
              <p className="text-caption text-muted-foreground">{description}</p>
            </div>
            <Switch
              checked={value[key]}
              onCheckedChange={(checked) => {
                onChange({ ...value, [key]: checked })
                toast.success(`${title} ${checked ? "enabled" : "disabled"}`)
              }}
              aria-label={title}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export { NotificationsSettingsSection }
