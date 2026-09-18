import { Check, Moon, Sun } from "lucide-react"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const paletteSwatches = [
  { label: "Primary", className: "bg-primary" },
  { label: "Secondary", className: "bg-secondary" },
  { label: "Accent", className: "bg-accent" },
  { label: "Success", className: "bg-success" },
  { label: "Warning", className: "bg-warning" },
  { label: "AI", className: "bg-ai" },
]

/** "Appearance" — shows the BabyNest visual identity; Light is the only available theme today. */
function AppearanceSettingsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Appearance</CardTitle>
        <p className="text-caption text-muted-foreground">The BabyNest visual identity used across the Admin</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 border-primary bg-card p-4",
              "ring-1 ring-primary/20"
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <Sun className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small font-medium text-foreground">Light</p>
              <p className="text-caption text-muted-foreground">The default BabyNest theme</p>
            </div>
            <Check className="size-4 shrink-0 text-primary" />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 opacity-60">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Moon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small font-medium text-foreground">Dark</p>
              <p className="text-caption text-muted-foreground">Not available yet</p>
            </div>
            <Badge variant="outline">Coming soon</Badge>
          </div>
        </div>

        <div>
          <p className="mb-2 text-small font-medium text-foreground">Brand Palette</p>
          <div className="flex flex-wrap gap-3">
            {paletteSwatches.map((swatch) => (
              <div key={swatch.label} className="flex flex-col items-center gap-1.5">
                <span className={cn("size-9 rounded-full ring-1 ring-foreground/10", swatch.className)} />
                <span className="text-caption text-muted-foreground">{swatch.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { AppearanceSettingsSection }
