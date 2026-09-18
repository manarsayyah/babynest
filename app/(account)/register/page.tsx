import type { Metadata } from "next"
import { AuthIllustrationPanel } from "@/components/auth/auth-illustration-panel"
import { RegisterFormCard } from "@/components/auth/register-form-card"

export const metadata: Metadata = {
  title: "Create Account | BabyNest",
  description: "Create a BabyNest account to save your preferences and track your orders.",
}

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <AuthIllustrationPanel
        heading="Join the BabyNest family."
        subtext="Create an account for personalized recommendations, order tracking, and a faster checkout."
      />
      <RegisterFormCard />
    </div>
  )
}
