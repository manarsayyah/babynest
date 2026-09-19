/**
 * Shared product-image map for the seed scripts (seed-catalog, seed-demo) and the
 * image-only updater (seed-images). One place decides which product uses a real photo.
 *
 * Only photos that clearly show the same type of product are listed. Every other
 * product keeps the BabyNest-styled placeholder, so the UI never depends on a photo
 * existing. Everything is stored locally and served by the app itself, so no external image host is needed:
 *   - real photos:  public/products/<slug>.jpg (originally from Pexels, free for commercial use, no attribution
 *     required). Photos with a visible brand were excluded on purpose.
 *   - placeholders: public/products/placeholders/*.svg, written by this module in the same BabyNest look the seeds
 *     always used (soft tint background, dark centred text).
 */
import fs from "node:fs"
import path from "node:path"

/** Slugs of the products that have a local photo at public/products/<slug>.jpg. */
export const PRODUCT_PHOTO_SLUGS: ReadonlySet<string> = new Set([
  "anti-colic-bottle-twin-pack",
  "baby-lotion-sensitive-skin",
  "bamboo-bibs-burp-cloth-bundle",
  "bath-time-squirty-toys",
  "cotton-romper-two-pack",
  "footed-cotton-sleepsuit",
  "gentle-baby-wash-shampoo",
  "gentle-glow-night-light",
  "knit-nursery-blanket",
  "lightweight-travel-stroller",
  "muslin-swaddle-blanket-set",
  "muslin-swaddle-blankets-3-pack",
  "organic-cotton-bodysuit-3-pack",
  "organic-long-sleeve-bodysuit",
  "plush-bunny-lovey",
  "stacking-rings-toy",
  "silicone-bath-toys-set",
  "silicone-suction-bowl-set",
  "soft-bath-washcloths-6-pack",
  "soft-plush-elephant",
  "tear-free-baby-shampoo",
  "ultra-soft-diapers-size-2",
  "wooden-building-blocks",
  "wooden-stacking-rings",
  "crib-mobile-woodland",
  "zip-front-sleepsuit-with-mitts",
])

const PLACEHOLDER_DIR = path.join(process.cwd(), "public", "products", "placeholders")
const PLACEHOLDER_URL_BASE = "/products/placeholders"
const PALETTE = ["F5EDE6", "FCEAE3", "E7F1FA", "F1EEFC", "FBF3DE", "E9F0E6"]

const slugify = (v: string) => v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
const escapeXml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

function wrapText(text: string, maxChars = 18): string[] {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && (line + " " + word).length > maxChars) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + " " + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Writes a BabyNest-styled 800x800 SVG placeholder (tint background, dark centred text) into public/products/placeholders. */
function writePlaceholderFile(fileName: string, text: string, bg: string): void {
  const lines = wrapText(text)
  const lineHeight = 64
  const startY = 400 - ((lines.length - 1) * lineHeight) / 2
  const tspans = lines.map((l, i) => `<text x="400" y="${startY + i * lineHeight}" text-anchor="middle" dominant-baseline="central">${escapeXml(l)}</text>`).join("")
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">` +
    `<rect width="800" height="800" fill="#${bg}"/>` +
    `<g fill="#2B2320" font-family="Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="52" font-weight="500">${tspans}</g></svg>
`
  fs.mkdirSync(PLACEHOLDER_DIR, { recursive: true })
  fs.writeFileSync(path.join(PLACEHOLDER_DIR, fileName), svg)
}

/** Local path of a product's placeholder slot: base slot by index, or a variant slot by label. */
export function placeholderPath(slug: string, index: number, variantLabel?: string): string {
  const name = variantLabel ? `${slug}-${slugify(variantLabel)}` : `${slug}-${index + 1}`
  return `${PLACEHOLDER_URL_BASE}/${name}.svg`
}

/** Creates the local placeholder file for a slot (unless `write` is false) and returns its /products/placeholders/... path. */
export function placeholderImageUrl(slug: string, seed: string, index: number, variantLabel?: string, bg?: string, write = true): string {
  const url = placeholderPath(slug, index, variantLabel)
  if (write) writePlaceholderFile(path.basename(url), `${seed} ${index + 1}`, bg ?? PALETTE[index % PALETTE.length])
  return url
}

/** Local replacement for an existing placehold.co URL: keeps its exact text and background colour. */
export function localizePlaceholderUrl(slug: string, oldUrl: string, index: number, variantLabel?: string, write = true): string {
  const parsed = new URL(oldUrl)
  const bg = parsed.pathname.split("/")[2] ?? PALETTE[0]
  const url = placeholderPath(slug, index, variantLabel)
  if (write) writePlaceholderFile(path.basename(url), parsed.searchParams.get("text") ?? "", bg)
  return url
}

export function hasPhoto(slug: string): boolean {
  return PRODUCT_PHOTO_SLUGS.has(slug)
}

/**
 * The image URL for a product slot. Mapped products use their local photo (/products/<slug>.jpg); a variant slot gets
 * the same file with a distinct `variant` query value (ignored by the static file server) so gallery entries stay
 * unique. Unmapped products get a local placeholder file.
 */
export function productImageUrl(slug: string, placeholderSeed: string, index: number, variantLabel?: string): string {
  if (!hasPhoto(slug)) return placeholderImageUrl(slug, placeholderSeed, index, variantLabel)
  const base = `/products/${slug}.jpg`
  return variantLabel ? `${base}?variant=${encodeURIComponent(variantLabel)}` : base
}
