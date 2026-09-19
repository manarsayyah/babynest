/**
 * Shared product-image map for the seed scripts (seed-catalog, seed-demo) and the
 * image-only updater (seed-images). One place decides which product uses a real photo.
 *
 * Only photos that clearly show the same type of product are listed. Every other
 * product keeps the BabyNest-styled placeholder, so the UI never depends on a photo
 * existing. Photos are from Pexels (free for commercial use, no attribution required),
 * served from the Pexels CDN by photo id. Photos with a visible brand were excluded on purpose.
 */

/** product slug -> Pexels photo id */
export const PRODUCT_PHOTO_IDS: Record<string, number> = {
  "anti-colic-bottle-twin-pack": 374756,
  "baby-lotion-sensitive-skin": 8533228,
  "bamboo-bibs-burp-cloth-bundle": 35727373,
  "bath-time-squirty-toys": 36723374,
  "cotton-romper-two-pack": 34121887,
  "footed-cotton-sleepsuit": 29015875,
  "gentle-baby-wash-shampoo": 8167172,
  "gentle-glow-night-light": 27176373,
  "knit-nursery-blanket": 6216236,
  "lightweight-travel-stroller": 15501373,
  "muslin-swaddle-blanket-set": 29234757,
  "muslin-swaddle-blankets-3-pack": 29234754,
  "organic-cotton-bodysuit-3-pack": 3875082,
  "organic-long-sleeve-bodysuit": 19471464,
  "plush-bunny-lovey": 5895046,
  "stacking-rings-toy": 9271761,
  "silicone-bath-toys-set": 36723384,
  "silicone-suction-bowl-set": 20387931,
  "soft-bath-washcloths-6-pack": 7691101,
  "soft-plush-elephant": 4886896,
  "tear-free-baby-shampoo": 8054407,
  "ultra-soft-diapers-size-2": 6849268,
  "wooden-building-blocks": 31061855,
  "wooden-stacking-rings": 9271757,
  "crib-mobile-woodland": 30161670,
  "zip-front-sleepsuit-with-mitts": 32410090,
}

/** BabyNest-styled placeholder (same look the seeds have always used). */
export function placeholderImageUrl(seed: string, index: number): string {
  const palette = ["F5EDE6", "FCEAE3", "E7F1FA", "F1EEFC", "FBF3DE", "E9F0E6"]
  return `https://placehold.co/800x800/${palette[index % palette.length]}/2B2320?font=roboto&text=${encodeURIComponent(`${seed} ${index + 1}`)}`
}

export function hasPhoto(slug: string): boolean {
  return slug in PRODUCT_PHOTO_IDS
}

/**
 * The image URL for a product slot. Mapped products use their photo; a variant slot gets the same photo with a
 * distinct `variant` query value (the CDN ignores it) so gallery entries stay unique. Unmapped products get the placeholder.
 */
export function productImageUrl(slug: string, placeholderSeed: string, index: number, variantLabel?: string): string {
  const id = PRODUCT_PHOTO_IDS[slug]
  if (id === undefined) return placeholderImageUrl(placeholderSeed, index)
  const base = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`
  return variantLabel ? `${base}&variant=${encodeURIComponent(variantLabel)}` : base
}
