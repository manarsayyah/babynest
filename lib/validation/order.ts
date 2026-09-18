import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

/**
 * Checkout accepts only which saved address to ship to and, optionally, a
 * promotion code — every price/discount/total is computed server-side.
 */
export const createOrderSchema = z.object({
  addressId: objectIdSchema,
  promotionCode: z.string().trim().min(1).max(50).optional(),
})

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
