import { z } from "zod"

export const aiAssistantSchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, "Please describe what you're looking for.")
    .max(500, "Message must be at most 500 characters."),
})

export const aiSearchSchema = z.object({
  query: z.string().trim().min(2, "Query is required.").max(300, "Query must be at most 300 characters."),
  limit: z.number().int().min(1).max(20).optional(),
})

export type AiAssistantInput = z.infer<typeof aiAssistantSchema>
export type AiSearchInput = z.infer<typeof aiSearchSchema>
