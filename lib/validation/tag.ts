import { z } from "zod"

export const createTagSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(50, "Name must be at most 50 characters."),
})

export const updateTagSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(50, "Name must be at most 50 characters.").optional(),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
