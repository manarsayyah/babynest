/**
 * Admin Settings — local-only mock state. No backend/persistence exists yet
 * for any of this, so every "save" here updates in-memory state and shows a
 * toast; nothing survives a page refresh. Kept in its own file so it's a
 * one-file swap once a real `/api/admin/settings` endpoint exists.
 */
export type GeneralSettings = {
  storeName: string
  storeEmail: string
  storePhone: string
  storeDescription: string
}

export const defaultGeneralSettings: GeneralSettings = {
  storeName: "BabyNest",
  storeEmail: "admin@babynest.com",
  storePhone: "+1 (555) 201-4471",
  storeDescription: "Premium, thoughtfully curated essentials for babies and toddlers.",
}

export type StoreSettings = {
  timezone: string
  orderProcessingEnabled: boolean
  inventoryTrackingEnabled: boolean
  lowStockThreshold: number
  outOfStockNotifications: boolean
}

export const defaultStoreSettings: StoreSettings = {
  timezone: "America/New_York",
  orderProcessingEnabled: true,
  inventoryTrackingEnabled: true,
  lowStockThreshold: 10,
  outOfStockNotifications: true,
}

export const timezoneOptions: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "Asia/Beirut", label: "Beirut" },
]

export type NotificationSettings = {
  newOrderNotifications: boolean
  lowStockAlerts: boolean
  newCustomerNotifications: boolean
  newReviewNotifications: boolean
  aiInsightNotifications: boolean
}

export const defaultAdminNotificationSettings: NotificationSettings = {
  newOrderNotifications: true,
  lowStockAlerts: true,
  newCustomerNotifications: false,
  newReviewNotifications: true,
  aiInsightNotifications: false,
}

export const notificationSettingsCopy: {
  key: keyof NotificationSettings
  title: string
  description: string
}[] = [
  {
    key: "newOrderNotifications",
    title: "New Order Notifications",
    description: "Get notified as soon as a customer places a new order.",
  },
  {
    key: "lowStockAlerts",
    title: "Low Stock Alerts",
    description: "Get notified when a product's stock drops below its threshold.",
  },
  {
    key: "newCustomerNotifications",
    title: "New Customer Notifications",
    description: "Get notified when a new customer creates an account.",
  },
  {
    key: "newReviewNotifications",
    title: "New Review Notifications",
    description: "Get notified when a customer submits a product review.",
  },
  {
    key: "aiInsightNotifications",
    title: "AI Insight Notifications",
    description: "Get notified when a new AI-generated insight or recommendation is ready.",
  },
]

/** Illustrative only — no real session backend exists yet. */
export type LoginActivityEntry = {
  id: string
  device: string
  location: string
  date: string
  current: boolean
}

export const mockLoginActivity: LoginActivityEntry[] = [
  { id: "session-1", device: "Chrome on Windows", location: "Beirut, Lebanon", date: "Today, 9:12 AM", current: true },
  { id: "session-2", device: "Safari on iPhone", location: "Beirut, Lebanon", date: "Yesterday, 6:40 PM", current: false },
  { id: "session-3", device: "Chrome on macOS", location: "Dubai, UAE", date: "Sept 10, 2026", current: false },
]
