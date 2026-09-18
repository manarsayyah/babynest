import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

export const addWishlistItemSchema = z.object({
  productId: objectIdSchema,
})

export type AddWishlistItemInput = z.infer<typeof addWishlistItemSchema>
