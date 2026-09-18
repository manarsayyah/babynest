import type { Metadata } from "next"
import { NotificationsPageContent } from "@/components/account/notifications-page-content"

export const metadata: Metadata = {
  title: "Notifications | BabyNest",
  description: "Control which notifications you receive from BabyNest.",
}

export default function NotificationsPage() {
  return <NotificationsPageContent />
}
