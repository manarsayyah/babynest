import type { Metadata } from "next"
import { AdminReviewsPageContent } from "@/components/admin/reviews/admin-reviews-page-content"

export const metadata: Metadata = { title: "Reviews" }

export default function AdminReviewsPage() {
  return <AdminReviewsPageContent />
}
