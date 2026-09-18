import { getInitialWishlistItems } from "@/lib/mock/wishlist"

export type AccountProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  avatar: string
}

/** Same demo identity as the Login page's mock credentials (demo@babynest.com). */
export const initialProfile: AccountProfile = {
  firstName: "Manar",
  lastName: "Sayyah",
  email: "demo@babynest.com",
  phone: "+961 71 234 567",
  dateOfBirth: "12 March 1995",
  gender: "Female",
  avatar: "https://placehold.co/200x200/FCE4E8/DB5E76?font=roboto&text=MS",
}

export type AccountAddress = {
  name: string
  line1: string
  city: string
  phone: string
  isDefault: boolean
}

export const defaultAddress: AccountAddress = {
  name: "Manar Sayyah",
  line1: "123 Main Street",
  city: "Beirut, Lebanon",
  phone: "+961 71 234 567",
  isDefault: true,
}

export type OrderStatus = "Delivered" | "Processing" | "Shipped"

export type AccountOrder = {
  id: string
  date: string
  itemsCount: number
  total: number
  status: OrderStatus
}

export const recentOrders: AccountOrder[] = [
  { id: "#BN-10245", date: "Sept 12, 2026", itemsCount: 3, total: 84.99, status: "Delivered" },
  { id: "#BN-10198", date: "Sept 5, 2026", itemsCount: 2, total: 52.5, status: "Processing" },
  { id: "#BN-10142", date: "Aug 28, 2026", itemsCount: 5, total: 138.2, status: "Shipped" },
]


export type NotificationSettings = {
  orderUpdates: boolean
  newProductRecommendations: boolean
  wishlistAlerts: boolean
  promotionalEmails: boolean
}

export const defaultNotificationSettings: NotificationSettings = {
  orderUpdates: true,
  newProductRecommendations: true,
  wishlistAlerts: true,
  promotionalEmails: false,
}

export const securityInfo = {
  passwordMasked: "••••••••",
  twoFactorEnabled: true,
  lastLogin: "Sept 14, 2026",
}

/** Overview stats — orders/reviews are illustrative mock counts; wishlist count reads the real seeded wishlist. */
export function getAccountStats() {
  return {
    totalOrders: recentOrders.length + 5,
    savedItems: getInitialWishlistItems().length,
    reviews: 6,
    aiRecommendations: 24,
  }
}
