import { z } from "zod"

export const PAYMENT_STATUSES = ["pending", "paid", "refunded", "failed"] as const

export const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
})

export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>
