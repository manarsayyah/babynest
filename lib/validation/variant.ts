import { z } from "zod"

export const createVariantSchema = z.object({
  sku: z.string().trim().min(1).max(50).optional(),
  variantName: z.string().trim().min(1).max(100).optional(),
  color: z.string().trim().max(50).optional(),
  size: z.string().trim().max(50).optional(),
  priceDelta: z.number().optional(),
  stockQty: z.number().int().min(0).optional(),
})

export const updateVariantSchema = createVariantSchema

export type CreateVariantInput = z.infer<typeof createVariantSchema>
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>
