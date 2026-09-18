import { Banknote, Info } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { initialProfile } from "@/lib/mock/account"

/**
 * "Payment Methods" account page. BabyNest doesn't integrate a real payment
 * gateway (no Stripe, no card storage/processing) — the only payment
 * method is Cash on Delivery, so this page is a simple informational
 * display rather than a card-management UI.
 */
function PaymentMethodsPageContent() {
  return (
    <main className="flex-1">
      <Container className="section-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={initialProfile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "Payment Methods" },
              ]}
            />
            <h1 className="text-h1 text-foreground">Payment Methods</h1>
            <p className="text-body text-muted-foreground">Manage how you pay for your BabyNest orders.</p>
          </div>

          <Card className="gap-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <Banknote className="size-4" />
                </span>
                <span className="text-small font-semibold text-foreground">Cash on Delivery</span>
              </div>
              <Badge variant="success">Default</Badge>
            </div>

            <p className="text-small text-muted-foreground">
              Pay in cash when your BabyNest order is delivered to you.
            </p>
          </Card>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Info className="size-4" />
            </span>
            <p className="text-small text-muted-foreground">
              Payment is collected when your order is delivered. No card information is required.
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}

export { PaymentMethodsPageContent }
