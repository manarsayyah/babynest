"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { NotificationSettings } from "@/lib/mock/account"

const labels: { key: keyof NotificationSettings; label: string }[] = [
  { key: "orderUpdates", label: "Order updates" },
  { key: "newProductRecommendations", label: "New product recommendations" },
  { key: "wishlistAlerts", label: "Wishlist alerts" },
  { key: "promotionalEmails", label: "Promotional emails" },
]

export type NotificationsCardProps = {
  value: NotificationSettings
  onChange: (next: NotificationSettings) => void
  className?: string
}

/** "Notifications" — toggleable local preferences (not persisted). */
function NotificationsCard({ value, onChange, className }: NotificationsCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Notifications</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {labels.map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={value[key]}
              onCheckedChange={(checked) => onChange({ ...value, [key]: checked === true })}
            />
            <span className="text-small text-foreground">{label}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}

export { NotificationsCard }
