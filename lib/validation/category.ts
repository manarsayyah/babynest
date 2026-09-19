import { z } from "zod"
import { objectIdSchema, slugSchema } from "@/lib/validation/shared"

export const CATEGORY_STATUSES = ["active", "inactive"] as const

const descriptionSchema = z.string().trim().max(500, "Description must be at most 500 characters.")

// An http(s) URL or a site-relative path (or empty, which clears it) — never a script/data URL.
const imageSchema = z
  .string()
  .trim()
  .max(2000, "Image URL is too long.")
  .refine((value) => value === "" || /^(https?:\/\/|\/)/i.test(value), "Image must be an http(s) URL or a site path.")

const statusSchema = z.enum(CATEGORY_STATUSES)

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  slug: slugSchema,
  description: descriptionSchema.optional(),
  parentCategoryId: objectIdSchema.nullable().optional(),
  image: imageSchema.optional(),
  status: statusSchema.optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be at most 100 characters.").optional(),
  slug: slugSchema.optional(),
  description: descriptionSchema.optional(),
  parentCategoryId: objectIdSchema.nullable().optional(),
  image: imageSchema.optional(),
  status: statusSchema.optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
