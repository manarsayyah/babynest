import { Sparkles, ShoppingBag, Heart, Star } from "lucide-react"
import { Card } from "@/components/ui/card"

/** A value of `null` means "not available" (still loading, or nothing real to count) and renders as a dash. */
export type AccountStatsProps = {
  totalOrders: number | null
  savedItems: number | null
  reviews: number | null
  aiRecommendations: number | null
}

/** 4-up stat row: Orders / Wishlist / Reviews / AI Matches. */
function AccountStats({ totalOrders, savedItems, reviews, aiRecommendations }: AccountStatsProps) {
  const stats = [
    { icon: ShoppingBag, label: "Orders", value: totalOrders, caption: "Total Orders" },
    { icon: Heart, label: "Wishlist", value: savedItems, caption: "Saved Items" },
    { icon: Star, label: "Reviews", value: reviews, caption: "Reviews" },
    { icon: Sparkles, label: "AI Matches", value: aiRecommendations, caption: "AI Recommendations" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, caption }) => (
        <Card key={label} className="gap-1.5 p-4">
          <span className="flex items-center gap-1.5 text-small font-medium text-muted-foreground">
            <Icon className="size-4 text-primary" />
            {label}
          </span>
          <span className="text-h2 text-foreground">{value ?? "—"}</span>
          <span className="text-caption text-muted-foreground">{caption}</span>
        </Card>
      ))}
    </div>
  )
}

export { AccountStats }
