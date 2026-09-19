import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

const preferences = [
  { title: "New Order Notifications", description: "Get notified as soon as a customer places a new order." },
  { title: "Low Stock Alerts", description: "Get notified when a product's stock drops below its threshold." },
  { title: "New Customer Notifications", description: "Get notified when a new customer creates an account." },
  { title: "New Review Notifications", description: "Get notified when a customer submits a product review." },
  { title: "AI Insight Notifications", description: "Get notified when a new insight or recommendation is ready." },
]

/**
 * "Notifications" — admin notification preferences. BabyNest only sends notifications to customers (order, shipment
 * and return updates), and there's nowhere to store admin preferences, so every switch is off and disabled.
 */
function NotificationsSettingsSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-h3">Notifications</CardTitle>
          <Badge variant="outline">Not available yet</Badge>
        </div>
        <p className="text-caption text-muted-foreground">Choose what the admin team gets notified about</p>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-border">
        <p className="pb-3 text-caption text-muted-foreground">
          Admin notifications don&apos;t exist yet: BabyNest currently only notifies customers about their own orders,
          shipments and returns, and has nowhere to save admin preferences.
        </p>
        {preferences.map(({ title, description }) => (
          <div key={title} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-small font-medium text-foreground">{title}</p>
              <p className="text-caption text-muted-foreground">{description}</p>
            </div>
            <Switch checked={false} disabled aria-label={title} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export { NotificationsSettingsSection }
