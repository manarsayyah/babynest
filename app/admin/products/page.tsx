import type { Metadata } from "next"
import { AdminProductsPageContent } from "@/components/admin/products/admin-products-page-content"

export const metadata: Metadata = { title: "Products" }

export default function AdminProductsPage() {
  return <AdminProductsPageContent />
}
