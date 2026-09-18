"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function notConnected(provider: string) {
  toast(`${provider} sign-in isn't connected yet`, {
    description: "This is a frontend-only demo for now.",
  })
}

/** "Continue with Google/Apple" — reused by Login now, Register later. Frontend-only stub. */
function SocialLoginButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button type="button" variant="outline" onClick={() => notConnected("Google")}>
        Continue with Google
      </Button>
      <Button type="button" variant="outline" onClick={() => notConnected("Apple")}>
        Continue with Apple
      </Button>
    </div>
  )
}

export { SocialLoginButtons }
