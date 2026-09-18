"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Bell,
  CreditCard,
  Heart,
  MapPin,
  Moon,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  Check,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DeleteAccountDialog } from "@/components/account/settings/delete-account-dialog"
import { initialProfile, securityInfo } from "@/lib/mock/account"
import {
  defaultCommunicationSettings,
  defaultPrivacySettings,
  type CommunicationSettings,
  type PrivacySettings,
} from "@/lib/mock/account-settings"

const quickLinks = [
  { href: "/personal-info", label: "Personal Information", icon: User },
  { href: "/account/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/addresses", label: "Addresses", icon: MapPin },
  { href: "/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/account/ai-preferences", label: "AI Preferences", icon: Sparkles },
]

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-small font-medium text-foreground">{title}</p>
        <p className="text-caption text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  )
}

function notWiredUp(action: string) {
  toast(`${action} isn't wired up yet`, { description: "This is a frontend-only demo." })
}

/**
 * Customer Account "Settings" — a general hub that links out to the
 * dedicated account pages, plus privacy/communication toggles, a static
 * Appearance section (no real theming exists in the project), and a
 * Security/Danger Zone. No backend exists, so nothing here is persisted —
 * every change only lives in local state for this session.
 */
function AccountSettingsPageContent() {
  const [privacy, setPrivacy] = React.useState<PrivacySettings>(defaultPrivacySettings)
  const [communication, setCommunication] = React.useState<CommunicationSettings>(defaultCommunicationSettings)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  function handleSignOut() {
    toast("Signed out", { description: "This is a frontend-only demo — no session was cleared." })
  }

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
                { label: "Settings" },
              ]}
            />
            <h1 className="text-h1 text-foreground">Settings</h1>
            <p className="text-body text-muted-foreground">
              Manage your account, privacy, and communication preferences.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Manage Your Account</CardTitle>
              <p className="text-caption text-muted-foreground">Jump to any part of your BabyNest account</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {quickLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex flex-col items-start gap-2 rounded-xl border border-border p-3 text-small font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40"
                    >
                      <span className="flex size-8 items-center justify-center rounded-full bg-accent text-primary">
                        <Icon className="size-4" />
                      </span>
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Account Settings</CardTitle>
              <p className="text-caption text-muted-foreground">Your login email and password</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
                <div>
                  <p className="text-small font-medium text-foreground">Account Email</p>
                  <p className="text-caption text-muted-foreground">{initialProfile.email}</p>
                </div>
                <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/personal-info" />}>
                  Update in Personal Information
                </Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                <div>
                  <p className="text-small font-medium text-foreground">Password</p>
                  <p className="text-caption text-muted-foreground">Update your password anytime for account security.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => notWiredUp("Change Password")}>
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Privacy</CardTitle>
              <p className="text-caption text-muted-foreground">Control how your data personalizes your experience</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              <ToggleRow
                title="Personalized Experience"
                description="Let BabyNest tailor product suggestions and content to you."
                checked={privacy.personalizedExperience}
                onCheckedChange={(checked) => setPrivacy((prev) => ({ ...prev, personalizedExperience: checked }))}
              />
              <ToggleRow
                title="Use Activity for Recommendations"
                description="Allow your browsing and purchase activity to improve AI recommendations."
                checked={privacy.useActivityForRecommendations}
                onCheckedChange={(checked) =>
                  setPrivacy((prev) => ({ ...prev, useActivityForRecommendations: checked }))
                }
              />
              <Link
                href="/account/ai-preferences"
                className="pt-3 text-small font-medium text-primary hover:underline"
              >
                Manage AI Preferences →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Communication</CardTitle>
              <p className="text-caption text-muted-foreground">Choose what BabyNest can email you about</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              <ToggleRow
                title="Email Communication"
                description="Receive order confirmations and account emails."
                checked={communication.email}
                onCheckedChange={(checked) => setCommunication((prev) => ({ ...prev, email: checked }))}
              />
              <ToggleRow
                title="Marketing Communication"
                description="Receive promotional emails and marketing campaigns."
                checked={communication.marketing}
                onCheckedChange={(checked) => setCommunication((prev) => ({ ...prev, marketing: checked }))}
              />
              <Link href="/notifications" className="pt-3 text-small font-medium text-primary hover:underline">
                Manage detailed notification preferences →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Appearance</CardTitle>
              <p className="text-caption text-muted-foreground">The BabyNest visual identity used across your account</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-card p-4 ring-1 ring-primary/20">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                    <Sun className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-foreground">Light</p>
                    <p className="text-caption text-muted-foreground">The default BabyNest theme</p>
                  </div>
                  <Check className="size-4 shrink-0 text-primary" />
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 opacity-60">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Moon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-small font-medium text-foreground">Dark</p>
                    <p className="text-caption text-muted-foreground">Not available yet</p>
                  </div>
                  <Badge variant="outline">Coming soon</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Security</CardTitle>
              <p className="text-caption text-muted-foreground">Your sign-in status for this account</p>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              <div className="flex items-center justify-between py-3 first:pt-0 text-small">
                <span className="text-muted-foreground">Two-Factor Authentication</span>
                <Badge variant={securityInfo.twoFactorEnabled ? "success" : "outline"}>
                  {securityInfo.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-3 text-small">
                <span className="text-muted-foreground">Last Login</span>
                <span className="font-medium text-foreground">{securityInfo.lastLogin}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                <div>
                  <p className="text-small font-medium text-foreground">Sign Out</p>
                  <p className="text-caption text-muted-foreground">Sign out of BabyNest on this device.</p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-destructive/30 bg-card p-5">
            <h2 className="text-small font-semibold text-destructive">Danger Zone</h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              This action is permanent and affects your entire BabyNest account.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-small font-medium text-foreground">Delete Account</p>
                <p className="text-caption text-muted-foreground">
                  Permanently delete your BabyNest account and all associated data.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </Container>

      <DeleteAccountDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} />
    </main>
  )
}

export { AccountSettingsPageContent }
