"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoginActivityDialog } from "@/components/admin/settings/login-activity-dialog"
import { ChangePasswordDialog } from "@/components/admin/settings/change-password-dialog"
import type { AdminSettings } from "@/lib/api-client/admin-settings"

export type SecuritySettingsSectionProps = {
  account: AdminSettings["account"]
  session: AdminSettings["session"]
}

/**
 * "Security" — Change Password is real (it changes the signed-in admin's own password). Two-factor authentication and
 * signing out other devices need infrastructure the project doesn't have (no 2FA fields, no session store), so
 * those controls are disabled and say so instead of pretending to work.
 */
function SecuritySettingsSection({ account, session }: SecuritySettingsSectionProps) {
  const [loginActivityOpen, setLoginActivityOpen] = React.useState(false)
  const [passwordOpen, setPasswordOpen] = React.useState(false)

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
            <Button variant="secondary" onClick={() => setPasswordOpen(true)}>
              Change Password
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-small font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-caption text-muted-foreground">
                  Not available yet — the current sign-in system has no two-factor support.
                </p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
            <Button variant="secondary" disabled>
              Enable 2FA
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-small font-medium text-foreground">Login Activity</p>
              <p className="text-caption text-muted-foreground">See the account and session you&apos;re signed in with.</p>
            </div>
            <Button variant="outline" onClick={() => setLoginActivityOpen(true)}>
              View Activity
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
            <div>
              <p className="text-small font-medium text-foreground">Session Management</p>
              <p className="text-caption text-muted-foreground">
                Not available yet — sessions aren&apos;t stored, so other devices can&apos;t be signed out.
              </p>
            </div>
            <Button variant="outline" disabled>
              Manage Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <LoginActivityDialog
        open={loginActivityOpen}
        account={account}
        session={session}
        onClose={() => setLoginActivityOpen(false)}
      />
    </>
  )
}

export { SecuritySettingsSection }
