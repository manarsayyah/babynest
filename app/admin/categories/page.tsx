import type { Metadata } from "next"
import { AdminCategoriesPageContent } from "@/components/admin/categories/admin-categories-page-content"

export const metadata: Metadata = { title: "Categories" }

export default function AdminCategoriesPage() {
  return <AdminCategoriesPageContent />
}
