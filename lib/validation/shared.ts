import { z } from "zod"

/** A MongoDB ObjectId in its 24-character hex string form. */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id.")

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Slug is required.")
  .max(150, "Slug must be at most 150 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens.")
