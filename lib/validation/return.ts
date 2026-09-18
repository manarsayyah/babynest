import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

export const RETURN_STATUSES = ["requested", "approved", "rejected", "completed"] as const

/** Valid admin status transitions — everything else (e.g. completed -> requested) is rejected. */
export const RETURN_STATUS_TRANSITIONS: Record<(typeof RETURN_STATUSES)[number], readonly string[]> = {
  requested: ["approved", "rejected"],
  approved: ["completed", "rejected"],
  rejected: [],
  completed: [],
}

export const createReturnItemSchema = z.object({
  orderItemId: objectIdSchema,
  quantity: z.number().int().positive("Quantity must be a positive integer."),
  condition: z.string().trim().max(200).optional(),
})

export const createReturnSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required.").max(500, "Reason must be at most 500 characters."),
  items: z.array(createReturnItemSchema).min(1, "At least one item is required."),
})

export const updateReturnItemSchema = z.object({
  id: objectIdSchema,
  quantity: z.number().int().positive().optional(),
  condition: z.string().trim().max(200).optional(),
})

export const updateReturnSchema = z.object({
  status: z.enum(RETURN_STATUSES).optional(),
  reason: z.string().trim().min(1).max(500).optional(),
  items: z.array(updateReturnItemSchema).optional(),
})

export type CreateReturnInput = z.infer<typeof createReturnSchema>
export type UpdateReturnInput = z.infer<typeof updateReturnSchema>
