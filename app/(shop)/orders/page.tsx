import type { Metadata } from "next"
import { OrdersPageContent } from "@/components/orders/orders-page-content"

export const metadata: Metadata = {
  title: "My Orders | BabyNest",
  description: "Track your purchases, view order details, and manage your BabyNest orders.",
}

export default function OrdersPage() {
  return <OrdersPageContent />
}
