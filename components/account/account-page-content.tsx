"use client"

import * as React from "react"
import { toast } from "sonner"
import { Container } from "@/components/layout/container"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { AccountHeader } from "@/components/account/account-header"
import { AccountStats } from "@/components/account/account-stats"
import { PersonalInformationCard } from "@/components/account/personal-information-card"
import { DefaultAddressCard } from "@/components/account/default-address-card"
import { RecentOrdersCard } from "@/components/account/recent-orders-card"
import { AIPreferencesCard } from "@/components/account/ai-preferences-card"
import { NotificationsCard } from "@/components/account/notifications-card"
import { SecurityCard } from "@/components/account/security-card"
import { AccountSettingsCard } from "@/components/account/account-settings-card"
import { fetchAddresses, type SavedAddress } from "@/lib/api-client/addresses"
import { useAiRecommendations } from "@/components/ai/use-ai-recommendations"
import { loadAIPreferences } from "@/lib/mock/ai-preferences"
import {
  defaultNotificationSettings,
  getAccountStats,
  initialProfile,
  recentOrders,
  securityInfo,
  type AccountProfile,
  type NotificationSettings,
} from "@/lib/mock/account"

/** Full Profile / My Account overview page: sidebar nav + welcome header + dashboard widgets. */
function AccountPageContent() {
  const [profile, setProfile] = React.useState<AccountProfile>(initialProfile)
  const [notifications, setNotifications] = React.useState<NotificationSettings>(
    defaultNotificationSettings
  )
  const [defaultAddress, setDefaultAddress] = React.useState<SavedAddress | null>(null)
  const [addressStatus, setAddressStatus] = React.useState<"loading" | "error" | "ready">("loading")
  const aiState = useAiRecommendations()
  const [favoriteCategories, setFavoriteCategories] = React.useState<string[]>([])
  const stats = React.useMemo(() => getAccountStats(), [])

  React.useEffect(() => {
    // The customer's own AI Preferences choices live in localStorage (no backend for them), which only
    // exists client-side — reading it during render would mismatch the server-rendered markup.
    /* eslint-disable react-hooks/set-state-in-effect */
    setFavoriteCategories(
      loadAIPreferences().selectedCategorySlugs.map((slug) => {
        const text = slug.replace(/-/g, " ")
        return text.charAt(0).toUpperCase() + text.slice(1)
      })
    )
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const list = await fetchAddresses()
        if (cancelled) return
        // The API sorts default-first; fall back to the first saved address only if none is flagged.
        setDefaultAddress(list.find((address) => address.isDefault) ?? list[0] ?? null)
        setAddressStatus("ready")
      } catch {
        if (!cancelled) setAddressStatus("error")
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="flex-1">
      <Container className="section-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={profile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <AccountHeader firstName={profile.firstName} />

          <AccountStats
            totalOrders={stats.totalOrders}
            savedItems={stats.savedItems}
            reviews={stats.reviews}
            aiRecommendations={stats.aiRecommendations}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <PersonalInformationCard profile={profile} onSave={setProfile} />
            <DefaultAddressCard address={defaultAddress} status={addressStatus} />
          </div>

          <RecentOrdersCard orders={recentOrders} />

          <AIPreferencesCard
            tags={favoriteCategories}
            matchPercent={
              aiState.status === "ready" && aiState.items.length > 0
                ? Math.round(aiState.items.reduce((sum, item) => sum + item.matchPercent, 0) / aiState.items.length)
                : null
            }
            newMatchesCount={aiState.status === "ready" ? aiState.items.length : null}
            onUpdatePreferences={() =>
              toast("AI preference editing isn't wired up yet", {
                description: "This is a frontend-only demo.",
              })
            }
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <NotificationsCard value={notifications} onChange={setNotifications} />
            <SecurityCard
              passwordMasked={securityInfo.passwordMasked}
              twoFactorEnabled={securityInfo.twoFactorEnabled}
              lastLogin={securityInfo.lastLogin}
            />
          </div>

          <AccountSettingsCard />
        </div>
      </Container>
    </main>
  )
}

export { AccountPageContent }
