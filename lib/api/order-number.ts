import crypto from "crypto"

/** A readable, collision-resistant order reference, e.g. "ORD-M5K2H1-9F3A". Never client-supplied. */
export function generateOrderNumber(): string {
  const timePart = Date.now().toString(36).toUpperCase()
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `ORD-${timePart}-${randomPart}`
}
