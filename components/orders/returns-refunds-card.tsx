import { RotateCcw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/** "Returns & Refunds" — a compact prompt card that opens the Start a Return modal. */
function ReturnsRefundsCard({ onStartReturn }: { onStartReturn: () => void }) {
  return (
    <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
          <RotateCcw className="size-[18px]" />
        </span>
        <div>
          <h2 className="text-h3 text-foreground">Returns & Refunds</h2>
          <p className="text-small text-muted-foreground">
            Eligible items can be returned within 30 days of delivery.
          </p>
        </div>
      </div>
      <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={onStartReturn}>
        Start a Return
      </Button>
    </Card>
  )
}

export { ReturnsRefundsCard }
