import type { Metadata } from "next"
import { AdminCustomersPageContent } from "@/components/admin/customers/admin-customers-page-content"

export const metadata: Metadata = { title: "Customers" }

export default function AdminCustomersPage() {
  return <AdminCustomersPageContent />
}
