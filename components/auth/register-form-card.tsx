"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff, Heart, Loader2, Lock, Mail, User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/form-error"
import { AuthInput } from "@/components/auth/auth-input"
import { SocialLoginButtons } from "@/components/auth/social-login-buttons"
import { registerSchema } from "@/lib/validation/register"

type FieldErrors = Partial<Record<"firstName" | "lastName" | "email" | "password", string>>

/** "Create Your Account" card — registers a real customer against the live database. */
function RegisterFormCard() {
  const router = useRouter()

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return

    setFormError(null)

    const parsed = registerSchema.safeParse({ firstName, lastName, email, password })
    if (!parsed.success) {
      const nextErrors: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === "string" && !(key in nextErrors)) {
          nextErrors[key as keyof FieldErrors] = issue.message
        }
      }
      setErrors(nextErrors)
      return
    }
    setErrors({})
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const data = await response.json().catch(() => null)

      if (response.status === 409) {
        setFormError(data?.error ?? "An account with this email already exists.")
        return
      }

      if (response.status === 400 && data?.fieldErrors) {
        setErrors(data.fieldErrors)
        setFormError(data?.error ?? "Please fix the highlighted fields.")
        return
      }

      if (!response.ok) {
        setFormError(data?.error ?? "Something went wrong. Please try again.")
        return
      }

      toast.success("Account created!", {
        description: "You can now sign in to your BabyNest account.",
      })
      router.push("/login")
    } catch {
      setFormError("Something went wrong. Please check your connection and try again.")
    } finally {
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
              <h1 className="text-h2 text-foreground">Create Your Account</h1>
              <p className="text-small text-muted-foreground">
                Join BabyNest for personalized picks and faster checkout.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <AuthInput
                id="register-first-name"
                icon={User}
                label="First Name"
                placeholder="Sarah"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  setErrors((prev) => ({ ...prev, firstName: undefined }))
                }}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <AuthInput
                id="register-last-name"
                icon={User}
                label="Last Name"
                placeholder="Johnson"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  setErrors((prev) => ({ ...prev, lastName: undefined }))
                }}
                error={errors.lastName}
                autoComplete="family-name"
              />
            </div>

            <AuthInput
              id="register-email"
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
              id="register-password"
              icon={Lock}
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              error={errors.password}
              autoComplete="new-password"
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

            <FormError message={formError} />

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
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
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export { RegisterFormCard }
