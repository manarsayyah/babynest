import type { Metadata } from "next"
import { WishlistPageContent } from "@/components/wishlist/wishlist-page-content"

export const metadata: Metadata = {
  title: "My Wishlist | BabyNest",
  description: "Your saved BabyNest favorites, all in one place.",
}

export default function WishlistPage() {
  return <WishlistPageContent />
}
