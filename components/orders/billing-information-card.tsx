import { Download } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type BillingInformationCardProps = {
  name: string
  addressLine1: string
  city: string
  onDownloadInvoice: () => void
}

/** "Billing Information" — name/address + a simulated PDF invoice download. */
function BillingInformationCard({
  name,
  addressLine1,
  city,
  onDownloadInvoice,
}: BillingInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Billing Information</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 text-small">
          <span className="font-medium text-foreground">{name}</span>
          <span className="text-muted-foreground">{addressLine1}</span>
          <span className="text-muted-foreground">{city}</span>
        </div>
        <Button variant="outline" className="w-full" onClick={onDownloadInvoice}>
          <Download data-icon="inline-start" />
          Download PDF Invoice
        </Button>
      </CardContent>
    </Card>
  )
}

export { BillingInformationCard }
