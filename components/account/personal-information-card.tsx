"use client"

import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AccountProfile } from "@/lib/mock/account"

export type PersonalInformationCardProps = {
  profile: AccountProfile
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="break-words text-small font-medium text-foreground">{value || "—"}</span>
    </div>
  )
}

/**
 * "Personal Information" — the customer's real account details (name/email from the signed-in session, phone
 * from their default address). There is no profile-editing backend, so "Edit Profile" says so instead of
 * pretending to save.
 */
function PersonalInformationCard({ profile }: PersonalInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatar}
            alt={`${profile.firstName} ${profile.lastName}`.trim()}
            className="size-14 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
          />
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-3">
            <Field label="First Name" value={profile.firstName} />
            <Field label="Last Name" value={profile.lastName} />
            <Field label="Email" value={profile.email} />
            <Field label="Date of Birth" value={profile.dateOfBirth} />
            <Field label="Phone" value={profile.phone} />
            <Field label="Gender" value={profile.gender} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              toast("Profile editing isn't available yet", {
                description: "Your name and email come from your account.",
              })
            }
          >
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { PersonalInformationCard }
