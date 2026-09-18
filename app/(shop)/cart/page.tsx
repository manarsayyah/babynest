import type { Metadata } from "next"
import { CartPageContent } from "@/components/shop/cart-page-content"

export const metadata: Metadata = {
  title: "Your Shopping Cart | BabyNest",
  description: "Review your cart, update quantities, apply a promo code, and check out.",
}

export default function CartPage() {
  return <CartPageContent />
}
