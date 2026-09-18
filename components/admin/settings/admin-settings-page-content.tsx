"use client"

import * as React from "react"
import { SettingsNav, type SettingsSection } from "@/components/admin/settings/settings-nav"
import { GeneralSettingsSection } from "@/components/admin/settings/general-settings-section"
import { StoreSettingsSection } from "@/components/admin/settings/store-settings-section"
import { NotificationsSettingsSection } from "@/components/admin/settings/notifications-settings-section"
import { SecuritySettingsSection } from "@/components/admin/settings/security-settings-section"
import { AppearanceSettingsSection } from "@/components/admin/settings/appearance-settings-section"
import { DangerZoneSection } from "@/components/admin/settings/danger-zone-section"
import {
  defaultAdminNotificationSettings,
  defaultGeneralSettings,
  defaultStoreSettings,
} from "@/lib/mock/admin-settings"

/** Admin Settings page: section nav (vertical on desktop, scrollable on mobile) + the active section, with Danger Zone always visible. */
function AdminSettingsPageContent() {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("general")
  const [general, setGeneral] = React.useState(defaultGeneralSettings)
  const [store, setStore] = React.useState(defaultStoreSettings)
  const [notifications, setNotifications] = React.useState(defaultAdminNotificationSettings)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-h1 text-foreground">Settings</h1>
        <p className="text-body text-muted-foreground">Manage your BabyNest store and admin preferences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <SettingsNav active={activeSection} onChange={setActiveSection} />

        <div className="min-w-0 flex-1">
          {activeSection === "general" ? <GeneralSettingsSection value={general} onSave={setGeneral} /> : null}
          {activeSection === "store" ? <StoreSettingsSection value={store} onSave={setStore} /> : null}
          {activeSection === "notifications" ? (
            <NotificationsSettingsSection value={notifications} onChange={setNotifications} />
          ) : null}
          {activeSection === "security" ? <SecuritySettingsSection /> : null}
          {activeSection === "appearance" ? <AppearanceSettingsSection /> : null}
        </div>
      </div>

      <DangerZoneSection />
    </div>
  )
}

export { AdminSettingsPageContent }
