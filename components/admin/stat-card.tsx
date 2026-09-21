import type { ElementType } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"

const toneClasses = {
  primary: "bg-accent text-primary",
  ai: "bg-ai-muted text-ai",
  warning: "bg-warning/15 text-warning-foreground",
  success: "bg-success/15 text-success",
} as const

export type StatCardProps = {
  icon: ElementType
  label: string
  value: string
  trendLabel?: string
  trendDirection?: "up" | "down"
  tone?: keyof typeof toneClasses
  className?: string
}

/** Compact stat tile — icon, number, label, and a small trend line. Dashboard-only KPI card. */
function StatCard({
  icon: Icon,
  label,
  value,
  trendLabel,
  trendDirection = "up",
  tone = "primary",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex-row items-center gap-2.5 p-3 sm:gap-3 sm:p-3.5", className)}>
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-lg leading-tight font-bold text-foreground">{value}</span>
        <span className="truncate text-caption font-medium text-muted-foreground">{label}</span>
        {trendLabel ? (
          <span
            className={cn(
              "text-caption leading-snug text-balance",
              trendDirection === "up" ? "text-success" : "text-destructive"
            )}
          >
            {trendDirection === "up" ? (
              <ArrowUpRight className="mr-1 inline size-3 align-[-1px]" />
            ) : (
              <ArrowDownRight className="mr-1 inline size-3 align-[-1px]" />
            )}
            {trendLabel}
          </span>
        ) : null}
      </div>
    </Card>
  )
}

export { StatCard }
