import { Sparkles } from "lucide-react"
import { Breadcrumb } from "@/components/layout/breadcrumb"

/** Breadcrumb + "Welcome back" heading for the account overview. */
function AccountHeader({ firstName }: { firstName: string }) {
  return (
    <div className="relative flex flex-col gap-2">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My Account" }]} />
      <Sparkles
        aria-hidden
        className="absolute top-0 right-0 hidden size-5 text-primary/50 sm:block"
      />
      <h1 className="text-h1 text-foreground">Welcome back, {firstName}!</h1>
      <p className="text-body text-muted-foreground">
        Manage your account, orders, preferences and BabyNest experience.
      </p>
    </div>
  )
}

export { AccountHeader }
