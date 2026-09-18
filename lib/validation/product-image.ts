import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

export const createProductImageSchema = z.object({
  imageUrl: z.string().trim().min(1, "Image URL is required.").max(2000),
  altText: z.string().trim().max(200).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  variantId: objectIdSchema.nullable().optional(),
})

export const updateProductImageSchema = z.object({
  imageUrl: z.string().trim().min(1).max(2000).optional(),
  altText: z.string().trim().max(200).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
  variantId: objectIdSchema.nullable().optional(),
})

export type CreateProductImageInput = z.infer<typeof createProductImageSchema>
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>
