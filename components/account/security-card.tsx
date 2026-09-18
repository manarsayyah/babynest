"use client"

import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type SecurityCardProps = {
  passwordMasked: string
  twoFactorEnabled: boolean
  lastLogin: string
  className?: string
}

/** "Security" — password/2FA/last login summary. Frontend-only stubs for the action buttons. */
function SecurityCard({ passwordMasked, twoFactorEnabled, lastLogin, className }: SecurityCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-h3">Security</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">Password</span>
          <span className="font-medium text-foreground">{passwordMasked}</span>
        </div>
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">2FA</span>
          <Badge variant={twoFactorEnabled ? "success" : "outline"}>
            {twoFactorEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-small">
          <span className="text-muted-foreground">Last Login</span>
          <span className="font-medium text-foreground">{lastLogin}</span>
        </div>

        <div className="mt-1 flex gap-2">
          <Button
            variant="secondary"
            onClick={() =>
              toast("Password change isn't wired up yet", {
                description: "This is a frontend-only demo.",
              })
            }
          >
            Change Password
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast("Security settings aren't wired up yet", {
                description: "This is a frontend-only demo.",
              })
            }
          >
            Security Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { SecurityCard }
