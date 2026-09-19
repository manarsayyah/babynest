/**
 * Local category images (nothing is fetched from an external host).
 *
 * Every category slug maps to a file under `public/`: either a product photo that already lives in
 * `public/products/` (so photos are not duplicated) or a category photo in `public/categories/`.
 * The map wins over an old `placehold.co` value stored on the category row, so no database change is needed;
 * an image an admin set deliberately (any other URL) is still respected.
 */
import { PLACEHOLDER_PRODUCT_IMAGE } from "./api-client/image"

const CATEGORY_IMAGES: Record<string, string> = {
  // Feeding
  feeding: "/products/silicone-suction-bowl-set.jpg",
  bottles: "/products/anti-colic-bottle-twin-pack.jpg",
  bibs: "/products/bamboo-bibs-burp-cloth-bundle.jpg",
  "feeding-accessories": "/products/silicone-suction-bowl-set.jpg",
  // Clothing
  clothing: "/products/cotton-romper-two-pack.jpg",
  bodysuits: "/products/organic-long-sleeve-bodysuit.jpg",
  sleepwear: "/products/zip-front-sleepsuit-with-mitts.jpg",
  // Bath & Care
  "bath-care": "/products/tear-free-baby-shampoo.jpg",
  "bath-accessories": "/products/bath-time-squirty-toys.jpg",
  "baby-care": "/products/baby-lotion-sensitive-skin.jpg",
  // Nursery
  nursery: "/products/crib-mobile-woodland.jpg",
  bedding: "/categories/bedding-crib.jpg",
  blankets: "/products/knit-nursery-blanket.jpg",
  // Toys
  toys: "/products/wooden-stacking-rings.jpg",
  "developmental-toys": "/products/wooden-building-blocks.jpg",
  "soft-toys": "/products/plush-bunny-lovey.jpg",
  // Strollers & Travel
  "strollers-travel": "/products/lightweight-travel-stroller.jpg",
  strollers: "/categories/strollers-pram.jpg",
  "carriers-travel": "/categories/carriers-baby-wrap.jpg",
  // Safety
  safety: "/categories/safety-stair-gate.jpg",
  "baby-monitors": "/categories/baby-monitor-screen.jpg",
  "safety-gates-locks": "/categories/safety-stair-gate.jpg",
  // Diapering
  diapering: "/products/ultra-soft-diapers-size-2.jpg",
  "diapers-wipes": "/products/ultra-soft-diapers-size-2.jpg",
  "changing-essentials": "/categories/changing-essentials-diapers.jpg",
  // Home "Shop by Category" rail slugs that differ from the catalog slugs
  diapers: "/products/ultra-soft-diapers-size-2.jpg",
  "car-seats": "/categories/car-seats.svg",
}

/** The local image path for a category slug, or undefined for a slug that has no mapped image. */
export function mappedCategoryImage(slug: string): string | undefined {
  return CATEGORY_IMAGES[slug]
}

/**
 * Image for a category card: the mapped local image, unless an admin stored a deliberate image on the category
 * (anything that is not empty or an old placehold.co value). Always returns a usable local path or that stored value.
 */
export function categoryImageFor(slug: string, storedImage?: string | null): string {
  const stored = storedImage?.trim()
  if (stored && !/placehold\.co/i.test(stored)) return stored
  return CATEGORY_IMAGES[slug] ?? PLACEHOLDER_PRODUCT_IMAGE
}
