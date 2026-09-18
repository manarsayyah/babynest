"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { toast } from "sonner"
import { Eye, EyeOff, Heart, Loader2, Lock, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormError } from "@/components/ui/form-error"
import { AuthInput } from "@/components/auth/auth-input"
import { SocialLoginButtons } from "@/components/auth/social-login-buttons"

type FieldErrors = { email?: string; password?: string }

/**
 * Only allow redirecting back to an internal, same-origin path. Resolving through
 * `URL` (rather than a `startsWith("/")` string check) closes backslash-based bypasses
 * like `/\evil.com`, which browsers normalize to `//evil.com` and would otherwise slip
 * past a prefix check while still reaching an external origin.
 */
function safeCallbackUrl(callbackUrl: string | null): string | null {
  if (!callbackUrl) return null
  try {
    const resolved = new URL(callbackUrl, window.location.origin)
    if (resolved.origin !== window.location.origin) return null
    return `${resolved.pathname}${resolved.search}${resolved.hash}`
  } catch {
    return null
  }
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}

  if (!email.trim()) errors.email = "Email is required"
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    errors.email = "Enter a valid email address"

  if (!password) errors.password = "Password is required"
  else if (password.length < 6) errors.password = "Password must be at least 6 characters"

  return errors
}

/** "Welcome Back" card — email/password sign-in via Auth.js credentials, backed by MongoDB. */
function LoginFormCard() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return

    const validationErrors = validate(email, password)
    setErrors(validationErrors)
    setFormError(null)

    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      })

      if (!result || result.error) {
        setFormError("Invalid email or password.")
        toast.error("Invalid email or password")
        setIsSubmitting(false)
        return
      }

      const session = await getSession()
      toast.success("Welcome back!", { description: "Signed in to your BabyNest account." })

      const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"))
      const defaultDestination = session?.user?.role === "admin" ? "/admin/dashboard" : "/account"
      router.push(callbackUrl ?? defaultDestination)
      router.refresh()
    } catch {
      setFormError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md p-2 shadow-md sm:p-4">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Link href="/" className="flex items-center gap-2 text-h3 font-extrabold tracking-tight">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Heart className="size-4 fill-primary-foreground" />
              </span>
              <span className="text-foreground">
                Baby<span className="text-primary">Nest</span>
              </span>
            </Link>
            <div className="flex flex-col gap-1">
              <h1 className="text-h2 text-foreground">Welcome Back</h1>
              <p className="text-small text-muted-foreground">
                Sign in to continue your BabyNest journey.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AuthInput
              id="login-email"
              icon={Mail}
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: undefined }))
              }}
              error={errors.email}
              autoComplete="email"
            />

            <AuthInput
              id="login-password"
              icon={Lock}
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              error={errors.password}
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <span className="text-small text-muted-foreground">Remember me</span>
              </label>
              <Link href="#" className="text-small font-medium text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <FormError message={formError} />

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-caption text-muted-foreground">or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <SocialLoginButtons />

          <p className="text-center text-small text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export { LoginFormCard }
