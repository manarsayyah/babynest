import type { Metadata } from "next"
import { AdminSettingsPageContent } from "@/components/admin/settings/admin-settings-page-content"

export const metadata: Metadata = { title: "Settings" }

export default function AdminSettingsPage() {
  return <AdminSettingsPageContent />
}
