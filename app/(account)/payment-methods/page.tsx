import type { Metadata } from "next"
import { PaymentMethodsPageContent } from "@/components/account/payment-methods-page-content"

export const metadata: Metadata = {
  title: "Payment Methods | BabyNest",
  description: "Manage your saved payment methods securely.",
}

export default function PaymentMethodsPage() {
  return <PaymentMethodsPageContent />
}
