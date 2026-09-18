import type { Metadata } from "next"
import { AdminReportsPageContent } from "@/components/admin/reports/admin-reports-page-content"

export const metadata: Metadata = { title: "Reports" }

export default function AdminReportsPage() {
  return <AdminReportsPageContent />
}
