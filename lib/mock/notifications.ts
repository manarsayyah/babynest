/**
 * Notification preferences for the dedicated Notifications page. Richer
 * than the Account overview's compact `NotificationSettings` (in
 * `lib/mock/account.ts`, 4 fields for that page's summary card) — this is
 * the full preference set the page needs, kept in its own file so it's a
 * one-file swap once a real `/api/account/notifications` endpoint exists.
 */
export type NotificationPreferenceKey =
  | "orderUpdates"
  | "promotionsOffers"
  | "newProducts"
  | "backInStockAlerts"
  | "wishlistUpdates"
  | "aiRecommendations"
  | "newsletter"

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export const notificationPreferenceCopy: { key: NotificationPreferenceKey; title: string; description: string }[] = [
  {
    key: "orderUpdates",
    title: "Order Updates",
    description: "Receive updates about order status, shipping and delivery.",
  },
  {
    key: "promotionsOffers",
    title: "Promotions & Offers",
    description: "Receive special offers, discounts and promotional campaigns.",
  },
  {
    key: "newProducts",
    title: "New Products",
    description: "Receive notifications about new products and collections.",
  },
  {
    key: "backInStockAlerts",
    title: "Back-in-Stock Alerts",
    description: "Get notified when a previously unavailable product becomes available.",
  },
  {
    key: "wishlistUpdates",
    title: "Wishlist Updates",
    description: "Receive updates about wishlist items such as price changes or availability.",
  },
  {
    key: "aiRecommendations",
    title: "AI Recommendations",
    description: "Receive personalized product recommendations.",
  },
  {
    key: "newsletter",
    title: "Newsletter",
    description: "Receive BabyNest newsletters and helpful content.",
  },
]

export const defaultNotificationPreferences: NotificationPreferences = {
  orderUpdates: true,
  promotionsOffers: false,
  newProducts: true,
  backInStockAlerts: true,
  wishlistUpdates: true,
  aiRecommendations: false,
  newsletter: false,
}

export type NotificationChannelKey = "email" | "sms" | "push"

export type NotificationChannels = Record<NotificationChannelKey, boolean>

export const notificationChannelCopy: {
  key: NotificationChannelKey
  title: string
  description: string
  /** No SMS/push service is connected in this project yet — these stay off and disabled so nothing claims to be live. */
  available: boolean
}[] = [
  {
    key: "email",
    title: "Email Notifications",
    description: "Sent to your account email address.",
    available: true,
  },
  {
    key: "sms",
    title: "SMS Notifications",
    description: "Sent as a text message to your phone.",
    available: false,
  },
  {
    key: "push",
    title: "Push Notifications",
    description: "Sent to your browser or device.",
    available: false,
  },
]

export const defaultNotificationChannels: NotificationChannels = {
  email: true,
  sms: false,
  push: false,
}
