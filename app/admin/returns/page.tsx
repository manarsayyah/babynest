import type { Metadata } from "next"
import { AdminReturnsPageContent } from "@/components/admin/returns/admin-returns-page-content"

export const metadata: Metadata = { title: "Returns" }

export default function AdminReturnsPage() {
  return <AdminReturnsPageContent />
}
