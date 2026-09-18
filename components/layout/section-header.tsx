import * as React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "cn"

export type SectionHeaderProps = {
  eyebrow?: React.ReactNode
  title: string
  description?: string
  action?: { href: string; label: string }
  align?: "start" | "center"
  className?: string
}

/** Shared "eyebrow + title + optional view-all link" heading used by every home-page rail. */
function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = "start",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className
      )}
    >
      <div className={cn("flex flex-col gap-2", align === "center" && "items-center")}>
        {eyebrow}
        <h2 className="text-h2 text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-body text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1 text-small font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:underline"
        >
          {action.label}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

export { SectionHeader }
