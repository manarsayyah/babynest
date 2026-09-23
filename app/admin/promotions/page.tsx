import type { Metadata } from "next"
import { AdminPromotionsPageContent } from "@/components/admin/promotions/admin-promotions-page-content"

export const metadata: Metadata = { title: "Promotions" }

export default function AdminPromotionsPage() {
  return <AdminPromotionsPageContent />
}
