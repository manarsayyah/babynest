"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AccountProfile } from "@/lib/mock/account"

export type PersonalInformationCardProps = {
  profile: AccountProfile
  onSave: (next: AccountProfile) => void
}

const genderOptions = ["Female", "Male", "Prefer not to say"]

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-small font-medium text-foreground">{value}</span>
    </div>
  )
}

/** "Personal Information" — read view by default, switches to an editable form via "Edit Profile". */
function PersonalInformationCard({ profile, onSave }: PersonalInformationCardProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(profile)

  function startEditing() {
    setDraft(profile)
    setIsEditing(true)
  }

  function handleSave() {
    if (!draft.firstName.trim() || !draft.lastName.trim()) {
      toast.error("First and last name are required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      toast.error("Enter a valid email address")
      return
    }
    onSave(draft)
    setIsEditing(false)
    toast.success("Profile updated")
  }

  function handleCancel() {
    setDraft(profile)
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isEditing ? (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar}
              alt={`${profile.firstName} ${profile.lastName}`}
              className="size-14 shrink-0 rounded-full object-cover ring-1 ring-foreground/10"
            />
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3">
              <Field label="First Name" value={profile.firstName} />
              <Field label="Last Name" value={profile.lastName} />
              <Field label="Email" value={profile.email} />
              <Field label="Date of Birth" value={profile.dateOfBirth} />
              <Field label="Phone" value={profile.phone} />
              <Field label="Gender" value={profile.gender} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={draft.firstName}
                onChange={(e) => setDraft((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={draft.lastName}
                onChange={(e) => setDraft((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                value={draft.dateOfBirth}
                onChange={(e) => setDraft((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={draft.phone}
                onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={draft.gender}
                onValueChange={(value) =>
                  setDraft((prev) => ({ ...prev, gender: value ?? prev.gender }))
                }
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
        )}

        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="secondary" onClick={startEditing}>
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleSave}>Save Changes</Button>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export { PersonalInformationCard }
