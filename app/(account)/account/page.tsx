import type { Metadata } from "next"
import { AccountPageContent } from "@/components/account/account-page-content"

export const metadata: Metadata = {
  title: "My Account | BabyNest",
  description: "Manage your BabyNest profile, orders, preferences and account settings.",
}

export default function AccountPage() {
  return <AccountPageContent />
}
