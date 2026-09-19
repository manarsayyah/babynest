/** Local avatar images (public/avatars) — a soft silhouette in one of four BabyNest tones, picked stably from an id. */
export const AVATARS = ["/avatars/avatar-rose.svg", "/avatars/avatar-lavender.svg", "/avatars/avatar-sage.svg", "/avatars/avatar-sand.svg"] as const

/** Default avatar (used where there is no per-person id, e.g. the signed-in customer's own sidebar). */
export const DEFAULT_AVATAR = AVATARS[0]

/** A stable avatar for an id (Mongo ObjectId hex or any string). */
export function avatarForId(id: string | null | undefined): string {
  if (!id) return DEFAULT_AVATAR
  const n = parseInt(id.slice(-2), 16)
  return AVATARS[(Number.isNaN(n) ? id.length : n) % AVATARS.length]
}
