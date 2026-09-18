import type { Metadata } from "next"
import { AdminOrdersPageContent } from "@/components/admin/orders/admin-orders-page-content"

export const metadata: Metadata = { title: "Orders" }

export default function AdminOrdersPage() {
  return <AdminOrdersPageContent />
}
