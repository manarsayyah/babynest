import type { Metadata } from "next"
import { CategoriesPageContent } from "@/components/shop/categories-page-content"

export const metadata: Metadata = {
  title: "Shop by Category | BabyNest",
  description: "Everything organized by what your little one needs next.",
}

export default function CategoriesPage() {
  return <CategoriesPageContent />
}
