import Link from "next/link"
import { Heart, ShieldCheck } from "lucide-react"
import { Container } from "@/components/layout/container"

/** Minimal checkout-only header — just the logo, no nav links or cart/account icons, to keep focus on the purchase. */
function CheckoutHeader() {
  return (
    <header className="border-b border-border bg-card">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-h3 font-extrabold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Heart className="size-4 fill-primary-foreground" />
          </span>
          <span className="text-foreground">
            Baby<span className="text-primary">Nest</span>
          </span>
        </Link>
        <span className="hidden items-center gap-1.5 text-caption text-muted-foreground sm:flex">
          <ShieldCheck className="size-4 text-success" />
          Secure Checkout
        </span>
      </Container>
    </header>
  )
}

export { CheckoutHeader }
