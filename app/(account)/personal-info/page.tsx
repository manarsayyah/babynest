import type { Metadata } from "next"
import { PersonalInfoPageContent } from "@/components/account/personal-info-page-content"

export const metadata: Metadata = {
  title: "Personal Information | BabyNest",
  description: "Manage the personal details on your BabyNest account.",
}

export default function PersonalInfoPage() {
  return <PersonalInfoPageContent />
}
