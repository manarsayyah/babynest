import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "cn"

/** Reusable inline validation message for form fields. Renders nothing if `message` is empty. */
function FormError({
  message,
  className,
  ...props
}: React.ComponentProps<"p"> & { message?: string | null }) {
  if (!message) return null

  return (
    <p
      data-slot="form-error"
      role="alert"
      className={cn(
        "flex items-center gap-1.5 text-small text-destructive",
        className
      )}
      {...props}
    >
      <AlertCircle className="size-3.5 shrink-0" />
      {message}
    </p>
  )
}

export { FormError }
