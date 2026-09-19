import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * "General Settings" — store identity fields. BabyNest has no settings storage (no settings model, and adding one
 * would change the approved data model), so these can't be saved. The fields stay visible but disabled and empty —
 * no invented values, no fake "saved" toast.
 */
function GeneralSettingsSection() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-h3">General Settings</CardTitle>
          <Badge variant="outline">Not available yet</Badge>
        </div>
        <p className="text-caption text-muted-foreground">Your store&apos;s basic identity and contact details</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-caption text-muted-foreground">
          Store details can&apos;t be edited yet: the application has no settings storage, and adding it needs a new data
          model. Nothing on this tab is saved.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-name">Store Name</Label>
            <Input id="store-name" placeholder="Not configured" disabled />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-email">Store Email</Label>
            <Input id="store-email" type="email" placeholder="Not configured" disabled />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="store-phone">Store Phone</Label>
            <Input id="store-phone" type="tel" placeholder="Not configured" disabled />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="store-description">Store Description</Label>
          <Textarea id="store-description" rows={3} placeholder="Not configured" disabled />
        </div>

        <div className="flex gap-2">
          <Button disabled>Save Changes</Button>
          <Button variant="outline" disabled>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { GeneralSettingsSection }
