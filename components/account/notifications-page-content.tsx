"use client"

import * as React from "react"
import { toast } from "sonner"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { NotificationsListCard } from "@/components/account/notifications-list-card"
import {
  defaultNotificationChannels,
  defaultNotificationPreferences,
  notificationChannelCopy,
  notificationPreferenceCopy,
  type NotificationChannels,
  type NotificationPreferences,
} from "@/lib/mock/notifications"
import { initialProfile } from "@/lib/mock/account"

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  badge,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  badge?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-small font-medium text-foreground">{title}</p>
          {badge}
        </div>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} aria-label={title} />
    </div>
  )
}

/**
 * Full "Notifications" account page: notification-type preferences +
 * delivery channels, with an explicit Save Preferences action. No backend
 * exists yet, so Save only confirms the current local state via a toast —
 * nothing is persisted, and no fake API call is made. SMS/Push channels
 * are shown as "Coming soon" and disabled since no SMS/push service is
 * connected in this project.
 */
function NotificationsPageContent() {
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(defaultNotificationPreferences)
  const [channels, setChannels] = React.useState<NotificationChannels>(defaultNotificationChannels)

  function handleSave() {
    toast.success("Preferences saved", {
      description: "Your notification preferences have been updated for this session.",
    })
  }

  return (
    <main className="flex-1">
      <Container className="account-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "Notifications" },
              ]}
            />
            <h1 className="text-account-title text-foreground">Notifications</h1>
            <p className="text-body text-muted-foreground">
              Control which notifications you receive from BabyNest.
            </p>
          </div>

          <NotificationsListCard />

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Notification Preferences</CardTitle>
              <p className="text-caption text-muted-foreground">Choose what you&apos;d like to hear about</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {notificationPreferenceCopy.map(({ key, title, description }) => (
                <ToggleRow
                  key={key}
                  title={title}
                  description={description}
                  checked={preferences[key]}
                  onCheckedChange={(checked) => setPreferences((prev) => ({ ...prev, [key]: checked }))}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Notification Channels</CardTitle>
              <p className="text-caption text-muted-foreground">Choose how you&apos;d like to be notified</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {notificationChannelCopy.map(({ key, title, description, available }) => (
                <ToggleRow
                  key={key}
                  title={title}
                  description={available ? description : `${description} Not connected yet.`}
                  checked={channels[key]}
                  onCheckedChange={(checked) => setChannels((prev) => ({ ...prev, [key]: checked }))}
                  disabled={!available}
                  badge={!available ? <Badge variant="outline">Coming soon</Badge> : null}
                />
              ))}
            </CardContent>
          </Card>

          <div>
            <Button onClick={handleSave}>Save Preferences</Button>
          </div>
        </div>
      </Container>
    </main>
  )
}

export { NotificationsPageContent }
