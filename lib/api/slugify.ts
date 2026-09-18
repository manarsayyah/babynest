/** Lowercases and hyphenates a display name into a URL-safe slug, e.g. "BPA-Free" -> "bpa-free". */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
