"use client"

import * as React from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { SettingsNav, type SettingsSection } from "@/components/admin/settings/settings-nav"
import { GeneralSettingsSection } from "@/components/admin/settings/general-settings-section"
import { StoreSettingsSection } from "@/components/admin/settings/store-settings-section"
import { NotificationsSettingsSection } from "@/components/admin/settings/notifications-settings-section"
import { SecuritySettingsSection } from "@/components/admin/settings/security-settings-section"
import { AppearanceSettingsSection } from "@/components/admin/settings/appearance-settings-section"
import { DangerZoneSection } from "@/components/admin/settings/danger-zone-section"
import { fetchAdminSettings, type AdminSettings } from "@/lib/api-client/admin-settings"
import { ApiRequestError } from "@/lib/api-client/fetcher"

function errorMessage(err: unknown) {
  if (err instanceof ApiRequestError) {
    if (err.status === 401) return "Your session has expired. Please sign in again."
    if (err.status === 403) return "You don't have permission to view settings."
    if (err.status < 500) return err.message
  }
  return "Something went wrong. Please try again."
}

/**
 * Admin Settings page: section nav (vertical on desktop, scrollable on mobile) + the active section, with Danger Zone
 * always visible. Loads the real account/store values from the backend; nothing falls back to mock data.
 */
function AdminSettingsPageContent() {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("general")
  const [settings, setSettings] = React.useState<AdminSettings | null>(null)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadToken, setReloadToken] = React.useState(0)

  React.useEffect(() => {
    const controller = new AbortController()

    fetchAdminSettings({ signal: controller.signal })
      .then((result) => {
        setSettings(result)
        setLoadError(null)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(errorMessage(err))
      })

    return () => controller.abort()
  }, [reloadToken])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-admin-title text-foreground">Settings</h1>
        <p className="text-body text-muted-foreground">Manage your BabyNest store and admin preferences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsNav active={activeSection} onChange={setActiveSection} />

        <div className="min-w-0 flex-1">
          {loadError ? (
            <EmptyState
              icon={TriangleAlert}
              title="Couldn't load settings"
              description={loadError}
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoadError(null)
                    setReloadToken((n) => n + 1)
                  }}
                >
                  Try again
                </Button>
              }
            />
          ) : settings === null ? (
            <Card className="p-5" aria-busy="true">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-6 w-48 rounded-md" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            </Card>
          ) : (
            <>
              {activeSection === "general" ? <GeneralSettingsSection /> : null}
              {activeSection === "store" ? <StoreSettingsSection store={settings.store} /> : null}
              {activeSection === "notifications" ? <NotificationsSettingsSection /> : null}
              {activeSection === "security" ? (
                <SecuritySettingsSection account={settings.account} session={settings.session} />
              ) : null}
              {activeSection === "appearance" ? <AppearanceSettingsSection /> : null}
            </>
          )}
        </div>
      </div>

      <DangerZoneSection />
    </div>
  )
}

export { AdminSettingsPageContent }
