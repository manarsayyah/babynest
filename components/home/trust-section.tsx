import { BadgeCheck, HandCoins, HeartHandshake, Sparkles } from "lucide-react"
import { Container } from "@/components/layout/container"
import { TrustStrip, type TrustStripItem } from "@/components/layout/trust-strip"

const benefits: TrustStripItem[] = [
  {
    icon: BadgeCheck,
    title: "Carefully Selected Products",
    description: "A focused catalog of baby essentials, chosen with care.",
  },
  {
    icon: HeartHandshake,
    title: "Safe & Trusted Choices",
    description: "Gentle materials and everyday items parents rely on.",
  },
  {
    icon: HandCoins,
    title: "Cash on Delivery",
    description: "Pay when your order arrives — no card needed at checkout.",
  },
  {
    icon: Sparkles,
    title: "Personalized Shopping",
    description: "Smart search and recommendations tailored to your baby.",
  },
]

/** Value-proposition strip — only claims BabyNest supports (Cash on Delivery is the checkout method). */
function TrustSection() {
  return (
    <section className="section-y">
      <Container>
        <TrustStrip items={benefits} />
      </Container>
    </section>
  )
}

export { TrustSection }
