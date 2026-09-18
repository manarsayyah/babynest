import { Flag, Headset, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type DeliverySupportCardProps = {
  onContactSupport: () => void
  onReportIssue: () => void
  onReturnItems: () => void
}

/** "Need help with your order?" — compact support actions, all local toast/modal stubs. */
function DeliverySupportCard({
  onContactSupport,
  onReportIssue,
  onReturnItems,
}: DeliverySupportCardProps) {
  return (
    <Card id="delivery-support">
      <CardHeader>
        <CardTitle className="text-h3">Need help with your order?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button variant="outline" className="justify-start" onClick={onContactSupport}>
          <Headset data-icon="inline-start" />
          Contact Support
        </Button>
        <Button variant="outline" className="justify-start" onClick={onReportIssue}>
          <Flag data-icon="inline-start" />
          Report an Issue
        </Button>
        <Button variant="outline" className="justify-start" onClick={onReturnItems}>
          <RotateCcw data-icon="inline-start" />
          Return Items
        </Button>
      </CardContent>
    </Card>
  )
}

export { DeliverySupportCard }
