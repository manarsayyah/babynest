import { Hero } from "@/components/home/hero"
import { FeaturedCategories } from "@/components/home/featured-categories"
import { FeaturedProducts } from "@/components/home/featured-products"
import { AISearchSection } from "@/components/home/ai-search-section"
import { RecommendationsSection } from "@/components/home/recommendations-section"
import { TrustSection } from "@/components/home/trust-section"
import { NewsletterSection } from "@/components/home/newsletter-section"

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <FeaturedCategories />
      <FeaturedProducts />
      <AISearchSection />
      <RecommendationsSection />
      <TrustSection />
      <NewsletterSection />
    </main>
  )
}
