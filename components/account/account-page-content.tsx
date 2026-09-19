"use client"

import * as React from "react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
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
import { fetchOrders, type Order } from "@/lib/api-client/orders"
import { fetchWishlist } from "@/lib/api-client/wishlist"
import { useAiRecommendations } from "@/components/ai/use-ai-recommendations"
import { loadAIPreferences } from "@/lib/mock/ai-preferences"
import type { AccountProfile, NotificationSettings } from "@/lib/mock/account"

/** Local, unsaved notification-preference toggles (no backend exists for them). */
const defaultNotificationSettings: NotificationSettings = {
  orderUpdates: true,
  newProductRecommendations: true,
  wishlistAlerts: true,
  promotionalEmails: false,
}

const RECENT_ORDER_COUNT = 3

/** Full Profile / My Account overview page: sidebar nav + welcome header + dashboard widgets. */
function AccountPageContent() {
  const [notifications, setNotifications] = React.useState<NotificationSettings>(
    defaultNotificationSettings
  )
  const [defaultAddress, setDefaultAddress] = React.useState<SavedAddress | null>(null)
  const [addressStatus, setAddressStatus] = React.useState<"loading" | "error" | "ready">("loading")
  const aiState = useAiRecommendations()
  const { data: session, status: sessionStatus } = useSession()
  const [favoriteCategories, setFavoriteCategories] = React.useState<string[]>([])
  const [orders, setOrders] = React.useState<Order[] | null>(null)
  const [ordersStatus, setOrdersStatus] = React.useState<"loading" | "error" | "ready">("loading")
  const [wishlistCount, setWishlistCount] = React.useState<number | null>(null)

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

    async function loadOrders() {
      try {
        const list = await fetchOrders()
        if (cancelled) return
        setOrders(list)
        setOrdersStatus("ready")
      } catch {
        if (!cancelled) setOrdersStatus("error")
      }
    }

    async function loadWishlist() {
      try {
        const list = await fetchWishlist()
        if (!cancelled) setWishlistCount(list.length)
      } catch {
        // Leave the count unknown (shown as a dash) rather than inventing a number.
      }
    }

    void load()
    void loadOrders()
    void loadWishlist()
    return () => {
      cancelled = true
    }
  }, [])

  // Identity comes only from the authenticated session; the phone from the customer's own default address
  // (the only phone number stored). Date of birth and gender are not stored anywhere.
  const firstName = sessionStatus === "authenticated" ? session.user.firstName : ""
  const lastName = sessionStatus === "authenticated" ? session.user.lastName : ""
  const profile: AccountProfile = {
    firstName,
    lastName,
    email: (sessionStatus === "authenticated" ? session.user.email : "") || "",
    phone: defaultAddress?.phone || "Not provided",
    dateOfBirth: "Not provided",
    gender: "Not provided",
    avatar: "/avatars/avatar-rose.svg",
  }

  return (
    <main className="flex-1">
      <Container className="section-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={profile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <AccountHeader firstName={firstName} />

          <AccountStats
            totalOrders={orders ? orders.length : null}
            savedItems={wishlistCount}
            reviews={null}
            aiRecommendations={aiState.status === "ready" ? aiState.items.length : null}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <PersonalInformationCard profile={profile} />
            <DefaultAddressCard address={defaultAddress} status={addressStatus} />
          </div>

          <RecentOrdersCard orders={orders ? orders.slice(0, RECENT_ORDER_COUNT) : null} status={ordersStatus} />

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
              passwordMasked="••••••••"
              twoFactorEnabled={false}
              lastLogin="Not tracked"
            />
          </div>

          <AccountSettingsCard />
        </div>
      </Container>
    </main>
  )
}

export { AccountPageContent }
