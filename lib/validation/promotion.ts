import { z } from "zod"

const DISCOUNT_TYPES = ["percentage", "fixed"] as const

const baseFields = {
  code: z
    .string()
    .trim()
    .min(1, "Code is required.")
    .max(50, "Code must be at most 50 characters.")
    .transform((value) => value.toUpperCase()),
  description: z.string().trim().max(500).optional(),
  discountType: z.enum(DISCOUNT_TYPES),
  discountValue: z.number().positive("Discount value must be greater than 0."),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isActive: z.boolean().optional(),
}

export const createPromotionSchema = z
  .object(baseFields)
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate.",
    path: ["endDate"],
  })
  .refine((data) => data.discountType !== "percentage" || data.discountValue <= 100, {
    message: "A percentage discount cannot exceed 100.",
    path: ["discountValue"],
  })

export const updatePromotionSchema = z
  .object({
    code: baseFields.code.optional(),
    description: baseFields.description,
    discountType: baseFields.discountType.optional(),
    discountValue: baseFields.discountValue.optional(),
    startDate: baseFields.startDate.optional(),
    endDate: baseFields.endDate.optional(),
    isActive: baseFields.isActive,
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate > data.startDate, {
    message: "endDate must be after startDate.",
    path: ["endDate"],
  })
  .refine((data) => data.discountType !== "percentage" || data.discountValue === undefined || data.discountValue <= 100, {
    message: "A percentage discount cannot exceed 100.",
    path: ["discountValue"],
  })

export const validatePromotionCodeSchema = z.object({
  code: z.string().trim().min(1, "Code is required."),
})

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>
