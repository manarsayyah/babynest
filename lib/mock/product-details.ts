import { mockCategories } from "@/lib/mock/categories"
import { shopCatalog, type ShopProduct } from "@/lib/mock/shop-catalog"

export type ProductReview = {
  id: string
  author: string
  rating: number
  date: string
  comment: string
}

export type ProductDetail = ShopProduct & {
  categoryLabel: string
  gallery: string[]
  colors?: { name: string; hex: string }[]
  summary: string
  description: string
  specifications: { label: string; value: string }[]
  aiMatchPercent: number
  aiHighlights: string[]
  shipping: { title: string; description: string }[]
  reviews: ProductReview[]
}

const COLOR_CATEGORIES = new Set(["clothing", "toys", "feeding", "bath-care"])
const COLOR_PALETTE = [
  { name: "Blush", hex: "#F4A6B7" },
  { name: "Sky", hex: "#9EC7E0" },
  { name: "Mint", hex: "#A8D8C0" },
  { name: "Sand", hex: "#E8C9A0" },
]

const MATERIAL_BY_CATEGORY: Record<string, string> = {
  clothing: "Organic cotton",
  diapers: "Ultra-absorbent core with breathable liner",
  toys: "Premium plush fabric, non-toxic fill",
  "bath-care": "Dermatologist-tested, tear-free formula",
  feeding: "Food-grade silicone, BPA-free",
  nursery: "BPA-free plastics and non-toxic finishes",
  strollers: "Lightweight aluminum frame, water-resistant canopy",
  "car-seats": "High-impact safety shell, breathable padding",
}

const WEIGHT_BY_CATEGORY: Record<string, string> = {
  clothing: "0.2 kg",
  diapers: "1.1 kg (pack)",
  toys: "0.3 kg",
  "bath-care": "0.4 kg",
  feeding: "0.25 kg",
  nursery: "1.5 kg",
  strollers: "8.2 kg",
  "car-seats": "5.6 kg",
}

const CARE_BY_CATEGORY: Record<string, string> = {
  clothing: "Machine washable, tumble dry low",
  diapers: "Single use",
  toys: "Surface wipe clean or gentle machine wash",
  "bath-care": "Rinse and air dry",
  feeding: "Dishwasher safe (top rack)",
  nursery: "Wipe clean with a damp cloth",
  strollers: "Wipe frame clean, spot-clean fabric",
  "car-seats": "Removable cover, machine washable",
}

const AI_HIGHLIGHTS_BY_CATEGORY: Record<string, string[]> = {
  clothing: [
    "Made from breathable, hypoallergenic fabric",
    "Soft on sensitive newborn skin",
    "Loved by parents for easy changing",
  ],
  diapers: [
    "Ultra-absorbent for overnight comfort",
    "Gentle on sensitive skin",
    "Trusted by thousands of parents",
  ],
  toys: [
    "Made from safe, non-toxic materials",
    "Perfect for cuddly, sensory play",
    "Highly rated by parents",
  ],
  "bath-care": [
    "Tear-free, dermatologist tested",
    "Gentle enough for daily use",
    "Loved for its soothing, calming scent",
  ],
  feeding: [
    "BPA-free and food-safe materials",
    "Designed for easy self-feeding",
    "Dishwasher safe for busy parents",
  ],
  nursery: [
    "Designed for safe, restful sleep",
    "Easy to install and maintain",
    "A nursery favorite among parents",
  ],
  strollers: [
    "Lightweight yet durable frame",
    "Smooth ride on any terrain",
    "Trusted for everyday safety",
  ],
  "car-seats": [
    "Meets top child safety standards",
    "Easy to install and adjust as baby grows",
    "Rated highly for crash protection",
  ],
}

const SHARED_SHIPPING = [
  { title: "Free Delivery", description: "On all orders over $50, arrives in 2-4 business days." },
  { title: "Secure Payment", description: "Your payment details are always encrypted and protected." },
  { title: "Easy Returns", description: "30-day hassle-free returns on unused, unopened items." },
]

const REVIEW_TEMPLATES = [
  { author: "Sarah M.", offset: 0 },
  { author: "James K.", offset: -1 },
  { author: "Priya R.", offset: 0 },
]

function formatAgeRange(min: number, max: number) {
  if (max <= 12) return `${min}-${max} months`
  if (min < 12) return `${min} months - ${Math.round(max / 12)} years`
  return `${Math.round(min / 12)}-${Math.round(max / 12)} years`
}

function buildGallery(image: string) {
  const base = image.split("?")[0]
  const params = new URLSearchParams(image.split("?")[1])
  const text = params.get("text") ?? "Product"
  return [1, 2, 3, 4].map((i) => `${base}?font=roboto&text=${text}+${i}`)
}

function buildReviews(product: ShopProduct): ProductReview[] {
  return REVIEW_TEMPLATES.map((template, index) => ({
    id: `${product.id}-review-${index}`,
    author: template.author,
    rating: Math.max(1, Math.min(5, Math.round(product.rating) + template.offset)),
    date: ["2 weeks ago", "1 month ago", "2 months ago"][index],
    comment: [
      `${product.name} exceeded my expectations — great quality and my baby loves it.`,
      `Good value for the price. Would recommend to other parents.`,
      `Exactly as described. Fast shipping and well packaged.`,
    ][index],
  }))
}

/** Looks up the full detail record for a product by slug, or `undefined` if it doesn't exist. */
export function getProductDetail(slug: string): ProductDetail | undefined {
  const base = shopCatalog.find((product) => product.slug === slug)
  if (!base) return undefined

  const category = mockCategories.find((c) => c.slug === base.category)

  return {
    ...base,
    categoryLabel: category?.name ?? base.category,
    gallery: buildGallery(base.image),
    colors: COLOR_CATEGORIES.has(base.category) ? COLOR_PALETTE : undefined,
    summary: `A soft and thoughtfully made ${base.name.toLowerCase()}, crafted from premium materials. A perfect companion for your little one.`,
    description: `This ${base.name.toLowerCase()} is designed to bring comfort and joy to your baby. Made with care and tested for safety, it's built to be a favorite for months to come.`,
    specifications: [
      { label: "Material", value: MATERIAL_BY_CATEGORY[base.category] ?? "Premium materials" },
      { label: "Recommended Age", value: formatAgeRange(base.ageRangeMonths.min, base.ageRangeMonths.max) },
      { label: "Weight", value: WEIGHT_BY_CATEGORY[base.category] ?? "Varies" },
      { label: "Care Instructions", value: CARE_BY_CATEGORY[base.category] ?? "Wipe clean" },
    ],
    aiMatchPercent: Math.max(85, Math.min(99, Math.round(base.rating * 20))),
    aiHighlights: AI_HIGHLIGHTS_BY_CATEGORY[base.category] ?? [
      "Safety-tested materials",
      "Loved by parents",
      "Great value for the quality",
    ],
    shipping: SHARED_SHIPPING,
    reviews: buildReviews(base),
  }
}

/** Up to `limit` other products from the same category, for "You May Also Like". */
export function getRelatedProducts(product: ShopProduct, limit = 3) {
  const sameCategory = shopCatalog.filter(
    (p) => p.category === product.category && p.id !== product.id
  )
  const pool = sameCategory.length >= limit
    ? sameCategory
    : [...sameCategory, ...shopCatalog.filter((p) => p.id !== product.id && p.category !== product.category)]
  return pool.slice(0, limit)
}
