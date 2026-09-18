/** Escapes regex metacharacters so user input is safe to interpolate into a MongoDB $regex filter. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
