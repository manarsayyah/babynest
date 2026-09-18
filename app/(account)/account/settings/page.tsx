import type { Metadata } from "next"
import { AccountSettingsPageContent } from "@/components/account/account-settings-page-content"

export const metadata: Metadata = {
  title: "Settings | BabyNest",
  description: "Manage your account, privacy, and communication preferences.",
}

export default function AccountSettingsPage() {
  return <AccountSettingsPageContent />
}
