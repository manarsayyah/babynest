import { z } from "zod"
import { objectIdSchema, slugSchema } from "@/lib/validation/shared"

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be at most 100 characters."),
  slug: slugSchema,
  parentCategoryId: objectIdSchema.nullable().optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be at most 100 characters.").optional(),
  slug: slugSchema.optional(),
  parentCategoryId: objectIdSchema.nullable().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
