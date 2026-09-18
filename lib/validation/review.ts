import { z } from "zod"

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  comment: z.string().trim().min(1, "Comment is required.").max(2000, "Comment must be at most 2000 characters."),
})

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).max(2000).optional(),
})

export const REVIEW_STATUSES = ["pending", "published", "hidden"] as const

export const adminUpdateReviewSchema = z.object({
  status: z.enum(REVIEW_STATUSES).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).max(2000).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type AdminUpdateReviewInput = z.infer<typeof adminUpdateReviewSchema>
