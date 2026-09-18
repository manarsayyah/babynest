import type { Metadata } from "next"
import { AddressesPageContent } from "@/components/account/addresses-page-content"

export const metadata: Metadata = {
  title: "Addresses | BabyNest",
  description: "Manage your saved delivery addresses.",
}

export default function AddressesPage() {
  return <AddressesPageContent />
}
