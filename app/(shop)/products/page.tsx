import type { Metadata } from "next"
import { Suspense } from "react"
import { ProductsPageContent } from "@/components/shop/products-page-content"

export const metadata: Metadata = {
  title: "Shop All Products | BabyNest",
  description:
    "Browse every BabyNest essential — filter by category, age range, price and rating to find exactly what your baby needs.",
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  )
}
