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
    image: "https://placehold.co/200x200/FCEAE3/DB5E76?font=roboto&text=Clothing",
    tintClassName: "bg-[#FCEAE3]",
  },
  {
    slug: "diapers",
    name: "Diapers",
    image: "https://placehold.co/200x200/E7F3EE/2F9E5B?font=roboto&text=Diapers",
    tintClassName: "bg-[#E7F3EE]",
  },
  {
    slug: "toys",
    name: "Toys",
    image: "https://placehold.co/200x200/F1EEFC/7C6AE8?font=roboto&text=Toys",
    tintClassName: "bg-[#F1EEFC]",
  },
  {
    slug: "bath-care",
    name: "Bath & Care",
    image: "https://placehold.co/200x200/E7F1FA/3A7CB8?font=roboto&text=Bath",
    tintClassName: "bg-[#E7F1FA]",
  },
  {
    slug: "feeding",
    name: "Feeding",
    image: "https://placehold.co/200x200/FCEEF2/B23F58?font=roboto&text=Feeding",
    tintClassName: "bg-[#FCEEF2]",
  },
  {
    slug: "nursery",
    name: "Nursery",
    image: "https://placehold.co/200x200/FBF3DE/C9971F?font=roboto&text=Nursery",
    tintClassName: "bg-[#FBF3DE]",
  },
  {
    slug: "strollers",
    name: "Strollers",
    image: "https://placehold.co/200x200/EFEAE3/7A4B2E?font=roboto&text=Strollers",
    tintClassName: "bg-[#EFEAE3]",
  },
  {
    slug: "car-seats",
    name: "Car Seats",
    image: "https://placehold.co/200x200/E9F0E6/4C7A46?font=roboto&text=Car+Seats",
    tintClassName: "bg-[#E9F0E6]",
  },
]
