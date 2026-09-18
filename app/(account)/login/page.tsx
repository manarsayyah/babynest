import { Suspense } from "react"
import type { Metadata } from "next"
import { AuthIllustrationPanel } from "@/components/auth/auth-illustration-panel"
import { LoginFormCard } from "@/components/auth/login-form-card"

export const metadata: Metadata = {
  title: "Sign In | BabyNest",
  description: "Sign in to your BabyNest account to continue shopping and track your orders.",
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <AuthIllustrationPanel
        heading="Everything your little one needs, in one nest."
        subtext="Discover trusted baby products with personalized recommendations powered by AI."
      />
      <Suspense>
        <LoginFormCard />
      </Suspense>
    </div>
  )
}
