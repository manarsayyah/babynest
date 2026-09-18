import type { Metadata } from "next"
import { CheckoutPageContent } from "@/components/checkout/checkout-page-content"

export const metadata: Metadata = {
  title: "Checkout | BabyNest",
  description: "Complete your BabyNest order — shipping, payment and order review.",
}

export default function CheckoutPage() {
  return <CheckoutPageContent />
}
