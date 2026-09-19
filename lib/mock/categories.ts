/**
 * Temporary mock data for the Home Page "Shop by Category" rail.
 * Isolated here so it is a one-file swap once `models/Category.ts` and the
 * real `/api/categories` endpoint exist (see the implementation plan,
 * Phase 5) — nothing outside this file should hardcode category data.
 */
export type MockCategory = {
  slug: string
  name: string
  image: string
  /** Tailwind background class for the circular tile behind the image. */
  tintClassName: string
}

export const mockCategories: MockCategory[] = [
  {
    slug: "clothing",
    name: "Clothing",
    image: "/products/cotton-romper-two-pack.jpg",
    tintClassName: "bg-[#FCEAE3]",
  },
  {
    slug: "diapers",
    name: "Diapers",
    image: "/products/ultra-soft-diapers-size-2.jpg",
    tintClassName: "bg-[#E7F3EE]",
  },
  {
    slug: "toys",
    name: "Toys",
    image: "/products/wooden-stacking-rings.jpg",
    tintClassName: "bg-[#F1EEFC]",
  },
  {
    slug: "bath-care",
    name: "Bath & Care",
    image: "/products/tear-free-baby-shampoo.jpg",
    tintClassName: "bg-[#E7F1FA]",
  },
  {
    slug: "feeding",
    name: "Feeding",
    image: "/products/silicone-suction-bowl-set.jpg",
    tintClassName: "bg-[#FCEEF2]",
  },
  {
    slug: "nursery",
    name: "Nursery",
    image: "/products/crib-mobile-woodland.jpg",
    tintClassName: "bg-[#FBF3DE]",
  },
  {
    slug: "strollers",
    name: "Strollers",
    image: "/categories/strollers-pram.jpg",
    tintClassName: "bg-[#EFEAE3]",
  },
  {
    slug: "car-seats",
    name: "Car Seats",
    image: "/categories/car-seats.svg",
    tintClassName: "bg-[#E9F0E6]",
  },
]
