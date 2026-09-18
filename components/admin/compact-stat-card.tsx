import type { ElementType } from "react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"

const toneClasses = {
  primary: "bg-accent text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning-foreground",
  ai: "bg-ai-muted text-ai",
  destructive: "bg-destructive/10 text-destructive",
} as const

export type CompactStatCardTone = keyof typeof toneClasses

export type CompactStatCardProps = {
  icon: ElementType
  label: string
  value: string
  note: string
  /** Colors the note text success/destructive instead of the default neutral muted tone. */
  noteTone?: "neutral" | "positive" | "attention"
  tone: CompactStatCardTone
}

/**
 * Compact icon + value + label tile shared by every Admin management page's
 * summary row (Products, Orders, Customers, Categories, Reviews, AI
 * Insights). The Dashboard's own KPI cards use a separate `StatCard` and
 * stay independent of this one — that separation was deliberate so the
 * Dashboard page never has to change when another admin page's summary
 * cards do, and vice versa.
 */
function CompactStatCard({ icon: Icon, label, value, note, noteTone = "neutral", tone }: CompactStatCardProps) {
  return (
    <Card className="flex-row items-center gap-3 p-3.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-lg leading-tight font-bold text-foreground">{value}</span>
        <span className="truncate text-caption font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "truncate text-caption",
            noteTone === "positive"
              ? "text-success"
              : noteTone === "attention"
                ? "text-destructive"
                : "text-muted-foreground/80"
          )}
        >
          {note}
        </span>
      </div>
    </Card>
  )
}

export { CompactStatCard }
