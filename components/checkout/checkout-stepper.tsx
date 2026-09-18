import { Check } from "lucide-react"
import { cn } from "cn"

const STEPS = ["Information", "Shipping", "Payment", "Review"]

/** Visual progress indicator — the checkout below is a single scrollable form, not a paginated wizard. */
function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto sm:gap-3">
      {STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <li key={step} className="flex shrink-0 items-center gap-2 sm:gap-3">
            {index > 0 ? <span className="h-px w-6 bg-border sm:w-10" aria-hidden /> : null}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-caption font-semibold",
                  isActive && "bg-primary text-primary-foreground",
                  isComplete && "bg-success text-success-foreground",
                  !isActive && !isComplete && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : stepNumber}
              </span>
              <span
                className={cn(
                  "text-small font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { CheckoutStepper }
