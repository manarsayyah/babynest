"use client"

import * as React from "react"
import { toast } from "sonner"
import { Camera } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { initialProfile, type AccountProfile } from "@/lib/mock/account"

const genderOptions = ["Female", "Male", "Prefer not to say"]

type Errors = Partial<Record<keyof AccountProfile, string>>

/**
 * Full "Personal Information" account settings page — always-editable form
 * (distinct from the compact view/edit-toggle card on the Account overview
 * page). No backend exists yet, so Save only updates local state for this
 * session; nothing is persisted, and no fake API call is made.
 */
function PersonalInfoPageContent() {
  const [profile, setProfile] = React.useState<AccountProfile>(initialProfile)
  const [draft, setDraft] = React.useState<AccountProfile>(initialProfile)
  const [errors, setErrors] = React.useState<Errors>({})

  function update<K extends keyof AccountProfile>(key: K, value: AccountProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const nextErrors: Errors = {}
    if (!draft.firstName.trim()) nextErrors.firstName = "First name is required."
    if (!draft.lastName.trim()) nextErrors.lastName = "Last name is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      nextErrors.email = "Enter a valid email address."
    }
    if (draft.phone.trim() && !/^[+()\-\s0-9]{7,}$/.test(draft.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number."
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setProfile(draft)
    toast.success("Personal information updated", {
      description: "Your changes have been saved for this session.",
    })
  }

  function handleCancel() {
    setDraft(profile)
    setErrors({})
  }

  return (
    <main className="flex-1">
      <Container className="account-y flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <AccountSidebar profile={profile} className="lg:sticky lg:top-20 lg:w-72 lg:shrink-0" />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "My Account", href: "/account" },
                { label: "Personal Information" },
              ]}
            />
            <h1 className="text-account-title text-foreground">Personal Information</h1>
            <p className="text-body text-muted-foreground">
              Manage the personal details on your BabyNest account.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatar}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="size-20 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
              />
              <div className="flex flex-col items-start gap-1.5">
                <p className="text-small font-medium text-foreground">
                  {profile.firstName} {profile.lastName}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    toast("Change Photo isn't wired up yet", {
                      description: "This is a frontend-only demo — no upload backend is connected.",
                    })
                  }
                >
                  <Camera data-icon="inline-start" />
                  Change Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-h3">Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={draft.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                    aria-invalid={Boolean(errors.firstName)}
                  />
                  <FormError message={errors.firstName} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={draft.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                    aria-invalid={Boolean(errors.lastName)}
                  />
                  <FormError message={errors.lastName} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={draft.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                  />
                  <FormError message={errors.email} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  <FormError message={errors.phone} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    value={draft.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="gender">Gender (optional)</Label>
                  <Select
                    value={draft.gender}
                    onValueChange={(value) => update("gender", value ?? draft.gender)}
                  >
                    <SelectTrigger id="gender" className="w-full rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>Save Changes</Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </main>
  )
}

export { PersonalInfoPageContent }
