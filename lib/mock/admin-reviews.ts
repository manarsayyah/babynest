import { shopCatalog } from "@/lib/mock/shop-catalog"

/**
 * Admin review moderation queue. Distinct from the lightweight, templated
 * `reviews` returned by `getProductDetail()` in `lib/mock/product-details.ts`
 * (three generic reviewers reused on every product page, with no status or
 * customer identity) — this is the fuller, per-customer dataset admins need
 * to moderate, kept in its own file so it's a one-file swap once a real
 * `/api/admin/reviews` endpoint exists. Product info is looked up from the
 * real `shopCatalog` rather than duplicated.
 */
export type ReviewStatus = "published" | "pending" | "hidden"

export type AdminReview = {
  id: string
  customerName: string
  customerEmail: string
  customerAvatar: string
  productSlug: string
  productName: string
  productImage: string
  rating: number
  comment: string
  /** ISO date the review was submitted. */
  date: string
  status: ReviewStatus
}

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  published: "Published",
  pending: "Pending",
  hidden: "Hidden",
}

function avatarFor(name: string, tone: "rose" | "lavender" | "sage" | "beige" = "rose") {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
  const palette: Record<typeof tone, string> = {
    rose: "FCE4E8/DB5E76",
    lavender: "F1EEFC/7C6AE8",
    sage: "E9F0E6/4C7A46",
    beige: "FBF3DE/C9971F",
  }
  return `https://placehold.co/80x80/${palette[tone]}?font=roboto&text=${initials}`
}

function bySlug(slug: string) {
  const product = shopCatalog.find((p) => p.slug === slug)
  if (!product) throw new Error(`Unknown mock review product slug: ${slug}`)
  return product
}

type SeedReview = {
  id: string
  customerName: string
  customerEmail: string
  avatarTone: "rose" | "lavender" | "sage" | "beige"
  productSlug: string
  rating: number
  comment: string
  date: string
  status: ReviewStatus
}

const seedReviews: SeedReview[] = [
  { id: "rev-1", customerName: "Sarah Miller", customerEmail: "sarah@example.com", avatarTone: "rose", productSlug: "organic-cotton-onesie", rating: 5, comment: "Beautiful quality and very soft. My baby loves wearing it.", date: "2026-09-10", status: "published" },
  { id: "rev-2", customerName: "Emma Wilson", customerEmail: "emma@example.com", avatarTone: "lavender", productSlug: "soft-cotton-sleep-gown", rating: 4, comment: "Very soft and comfortable. The size was perfect.", date: "2026-09-11", status: "pending" },
  { id: "rev-3", customerName: "Lina Carter", customerEmail: "lina@example.com", avatarTone: "sage", productSlug: "silicone-bib-set", rating: 5, comment: "Excellent quality and easy to clean.", date: "2026-09-09", status: "published" },
  { id: "rev-4", customerName: "Omar Khalil", customerEmail: "omar@example.com", avatarTone: "beige", productSlug: "premium-baby-stroller", rating: 5, comment: "Smooth ride and folds up easily. Worth every penny.", date: "2026-09-08", status: "published" },
  { id: "rev-5", customerName: "Nour Fares", customerEmail: "nour@example.com", avatarTone: "rose", productSlug: "baby-monitor", rating: 4, comment: "Great picture quality, though the app took a bit to set up.", date: "2026-09-08", status: "published" },
  { id: "rev-6", customerName: "Manar Sayyah", customerEmail: "manar@example.com", avatarTone: "lavender", productSlug: "soft-plush-bear", rating: 5, comment: "So soft and cuddly, my daughter won't let it go.", date: "2026-09-07", status: "published" },
  { id: "rev-7", customerName: "Rami Saad", customerEmail: "rami@example.com", avatarTone: "sage", productSlug: "convertible-car-seat", rating: 3, comment: "Sturdy but the straps are a little tricky to adjust.", date: "2026-09-07", status: "pending" },
  { id: "rev-8", customerName: "Layla Haddad", customerEmail: "layla@example.com", avatarTone: "beige", productSlug: "wooden-stacking-toy", rating: 5, comment: "Beautiful craftsmanship and keeps my toddler entertained.", date: "2026-09-06", status: "published" },
  { id: "rev-9", customerName: "Yousef Nassar", customerEmail: "yousef@example.com", avatarTone: "rose", productSlug: "overnight-diapers-size-3", rating: 2, comment: "Leaked twice overnight, expected better absorbency.", date: "2026-09-06", status: "hidden" },
  { id: "rev-10", customerName: "Dana Aziz", customerEmail: "dana@example.com", avatarTone: "lavender", productSlug: "baby-bath-care-set", rating: 5, comment: "Smells amazing and gentle on sensitive skin.", date: "2026-09-05", status: "published" },
  { id: "rev-11", customerName: "Hana Odeh", customerEmail: "hana@example.com", avatarTone: "sage", productSlug: "starlight-nursery-mobile", rating: 5, comment: "Calms my baby right down at bedtime, gorgeous design.", date: "2026-09-05", status: "published" },
  { id: "rev-12", customerName: "Karim Mansour", customerEmail: "karim@example.com", avatarTone: "beige", productSlug: "knit-baby-cardigan", rating: 4, comment: "Warm and well made, runs slightly small.", date: "2026-09-04", status: "published" },
  { id: "rev-13", customerName: "Farah Zidan", customerEmail: "farah@example.com", avatarTone: "rose", productSlug: "silicone-bath-toys", rating: 5, comment: "Easy to clean and my son loves splashing with them.", date: "2026-09-04", status: "published" },
  { id: "rev-14", customerName: "Adam Haddad", customerEmail: "adam@example.com", avatarTone: "lavender", productSlug: "infant-car-seat-with-base", rating: 4, comment: "Installation was straightforward, feels very secure.", date: "2026-09-03", status: "pending" },
  { id: "rev-15", customerName: "Maya Kassab", customerEmail: "maya@example.com", avatarTone: "sage", productSlug: "hooded-bath-towel-set", rating: 5, comment: "Super absorbent and the hood is adorable.", date: "2026-09-03", status: "published" },
  { id: "rev-16", customerName: "Tariq Amin", customerEmail: "tariq@example.com", avatarTone: "beige", productSlug: "compact-travel-stroller", rating: 3, comment: "Compact but a bit heavier than expected for travel.", date: "2026-09-02", status: "published" },
  { id: "rev-17", customerName: "Salma Rahal", customerEmail: "salma@example.com", avatarTone: "rose", productSlug: "bamboo-toddler-feeding-set", rating: 5, comment: "Durable and my toddler loves picking her own bowl.", date: "2026-09-02", status: "published" },
  { id: "rev-18", customerName: "Nadia Farouk", customerEmail: "nadia@example.com", avatarTone: "lavender", productSlug: "sensitive-skin-diapers", rating: 4, comment: "No irritation at all, will repurchase.", date: "2026-09-01", status: "published" },
  { id: "rev-19", customerName: "Zaid Homsi", customerEmail: "zaid@example.com", avatarTone: "sage", productSlug: "glass-baby-bottle-set", rating: 5, comment: "Easy to clean glass bottles, no plastic taste.", date: "2026-09-01", status: "published" },
  { id: "rev-20", customerName: "Rania Saleh", customerEmail: "rania@example.com", avatarTone: "beige", productSlug: "baby-play-gym", rating: 1, comment: "Arrived with a broken arch, disappointed.", date: "2026-08-31", status: "hidden" },
  { id: "rev-21", customerName: "Bilal Nasser", customerEmail: "bilal@example.com", avatarTone: "rose", productSlug: "blackout-nursery-curtains", rating: 4, comment: "Blocks light really well, easy to install.", date: "2026-08-31", status: "published" },
  { id: "rev-22", customerName: "Yasmin Toubasi", customerEmail: "yasmin@example.com", avatarTone: "lavender", productSlug: "organic-cotton-onesie", rating: 5, comment: "Soft fabric that holds up after many washes.", date: "2026-08-30", status: "pending" },
  { id: "rev-23", customerName: "Sarah Miller", customerEmail: "sarah@example.com", avatarTone: "rose", productSlug: "baby-monitor", rating: 4, comment: "Reliable night vision, battery life could be longer.", date: "2026-08-29", status: "published" },
  { id: "rev-24", customerName: "Omar Khalil", customerEmail: "omar@example.com", avatarTone: "beige", productSlug: "soft-plush-bear", rating: 5, comment: "Perfect gift, beautifully packaged too.", date: "2026-08-28", status: "published" },
]

export const adminReviews: AdminReview[] = seedReviews.map((seed) => {
  const product = bySlug(seed.productSlug)
  return {
    id: seed.id,
    customerName: seed.customerName,
    customerEmail: seed.customerEmail,
    customerAvatar: avatarFor(seed.customerName, seed.avatarTone),
    productSlug: product.slug,
    productName: product.name,
    productImage: product.image,
    rating: seed.rating,
    comment: seed.comment,
    date: seed.date,
    status: seed.status,
  }
})

export const reviewProductOptions = Array.from(new Set(adminReviews.map((r) => r.productSlug))).map((slug) => {
  const product = bySlug(slug)
  return { value: slug, label: product.name }
})

export function formatReviewDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
