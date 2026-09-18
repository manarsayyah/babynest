"use client"

import * as React from "react"
import { toast } from "sonner"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/** "Account Settings" — collapsible, with a Danger Zone delete action (simulated, never real). */
function AccountSettingsCard() {
  const [isOpen, setIsOpen] = React.useState(true)

  function handleDeleteAccount() {
    toast("Delete your account?", {
      description: "This is a frontend demo — nothing will actually be deleted.",
      action: {
        label: "Confirm",
        onClick: () => toast.success("Account deletion simulated"),
      },
    })
  }

  return (
    <Card>
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between"
        onClick={() => setIsOpen((open) => !open)}
      >
        <CardTitle className="text-h3">Account Settings</CardTitle>
        <ChevronDown
          className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
        />
      </CardHeader>
      {isOpen ? (
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3.5">
            <span className="text-small font-medium text-foreground">Danger Zone</span>
            <Button variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      ) : null}
    </Card>
  )
}

export { AccountSettingsCard }
