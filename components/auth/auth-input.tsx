import * as React from "react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"

export type AuthInputProps = React.ComponentProps<"input"> & {
  icon: React.ElementType
  label: string
  error?: string | null
  trailing?: React.ReactNode
}

/** Warm-tinted, icon-leading input used by auth forms (Login now, Register later). */
function AuthInput({ icon: Icon, label, error, trailing, id, className, ...props }: AuthInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center">
        <Icon className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
        <Input
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 rounded-xl border-primary/20 bg-secondary/40 pl-10",
            trailing && "pr-10",
            className
          )}
          {...props}
        />
        {trailing ? <div className="absolute right-3 flex items-center">{trailing}</div> : null}
      </div>
      <FormError message={error} />
    </div>
  )
}

export { AuthInput }
