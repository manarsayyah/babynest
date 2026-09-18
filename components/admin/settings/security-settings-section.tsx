"use client"

import * as React from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoginActivityDialog } from "@/components/admin/settings/login-activity-dialog"

function notWiredUp(action: string) {
  toast(`${action} isn't wired up yet`, { description: "This is a frontend-only demo." })
}

/** "Security" — status only, no real auth is connected, so nothing here claims to be active. */
function SecuritySettingsSection() {
  const [loginActivityOpen, setLoginActivityOpen] = React.useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">Security</CardTitle>
          <p className="text-caption text-muted-foreground">Password, two-factor authentication, and sessions</p>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
            <div>
              <p className="text-small font-medium text-foreground">Password</p>
              <p className="text-caption text-muted-foreground">Last changed: not tracked yet</p>
            </div>
            <Button variant="secondary" onClick={() => notWiredUp("Change Password")}>
              Change Password
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-small font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-caption text-muted-foreground">Add an extra layer of security to admin sign-in.</p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
            <Button variant="secondary" onClick={() => notWiredUp("Two-factor setup")}>
              Enable 2FA
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-small font-medium text-foreground">Login Activity</p>
              <p className="text-caption text-muted-foreground">Review recent sign-ins to your admin account.</p>
            </div>
            <Button variant="outline" onClick={() => setLoginActivityOpen(true)}>
              View Activity
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
            <div>
              <p className="text-small font-medium text-foreground">Session Management</p>
              <p className="text-caption text-muted-foreground">Sign out of other devices signed in to this account.</p>
            </div>
            <Button variant="outline" onClick={() => notWiredUp("Session management")}>
              Manage Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      <LoginActivityDialog open={loginActivityOpen} onClose={() => setLoginActivityOpen(false)} />
    </>
  )
}

export { SecuritySettingsSection }
