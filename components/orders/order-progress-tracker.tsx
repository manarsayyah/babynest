import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "cn"

const STEPS = ["Order Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered"]

export type OrderProgressTrackerProps = {
  /** Cancelled orders don't render this tracker at all — handle that in the parent. */
  status: "pending" | "processing" | "shipped" | "delivered"
}

const COMPLETED_THROUGH: Record<OrderProgressTrackerProps["status"], number> = {
  pending: 1,
  processing: 1,
  shipped: 3,
  delivered: 5,
}
const CURRENT_STEP: Record<OrderProgressTrackerProps["status"], number> = {
  pending: 2,
  processing: 2,
  shipped: 4,
  delivered: -1,
}

/** 5-node status tracker — horizontal on desktop, a vertical timeline on mobile. */
function OrderProgressTracker({ status }: OrderProgressTrackerProps) {
  const completedThrough = COMPLETED_THROUGH[status]
  const currentStep = CURRENT_STEP[status]

  return (
    <div className="flex flex-col sm:flex-row sm:items-start">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1
        const isDone = stepNumber <= completedThrough
        const isCurrent = stepNumber === currentStep
        const isLast = index === STEPS.length - 1

        return (
          <React.Fragment key={label}>
            <div className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                  isDone && "border-success bg-success text-success-foreground",
                  isCurrent && "border-primary bg-primary/10",
                  !isDone && !isCurrent && "border-border bg-card"
                )}
              >
                {isDone ? (
                  <Check className="size-3.5" />
                ) : isCurrent ? (
                  <span className="size-2 rounded-full bg-primary" />
                ) : null}
              </span>
              <span
                className={cn(
                  "text-caption font-medium",
                  isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {!isLast ? (
              <div
                className={cn(
                  "ml-3.5 h-6 w-px sm:ml-0 sm:mt-3.5 sm:h-px sm:w-auto sm:flex-1",
                  stepNumber <= completedThrough ? "bg-success" : "bg-border"
                )}
              />
            ) : null}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export { OrderProgressTracker }
