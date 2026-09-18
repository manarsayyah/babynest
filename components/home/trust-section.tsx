import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { Container } from "@/components/layout/container"
import { TrustStrip, type TrustStripItem } from "@/components/layout/trust-strip"

const benefits: TrustStripItem[] = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free shipping on orders over $50, delivered in 2-4 days.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "Your payment details are always encrypted and protected.",
  },
  {
    icon: BadgeCheck,
    title: "Trusted Products",
    description: "Every item is safety-tested and pediatrician-reviewed.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30-day hassle-free returns on unused, unopened items.",
  },
]

/** Trust/benefits strip — fast delivery, secure payment, trusted products, easy returns. */
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
