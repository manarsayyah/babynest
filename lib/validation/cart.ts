import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

export const addCartItemSchema = z.object({
  variantId: objectIdSchema,
  quantity: z.number().int().positive("Quantity must be a positive integer."),
})

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be a positive integer."),
})

export type AddCartItemInput = z.infer<typeof addCartItemSchema>
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>
