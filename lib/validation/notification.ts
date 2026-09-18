import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

export const updateNotificationSchema = z.object({
  isRead: z.boolean(),
})

/** Admin-only creation — userId/type/title/message are all admin-supplied here (unlike automatic hooks). */
export const createNotificationSchema = z.object({
  userId: objectIdSchema,
  type: z.string().trim().min(1, "Type is required.").max(50),
  title: z.string().trim().min(1, "Title is required.").max(200),
  message: z.string().trim().min(1, "Message is required.").max(1000),
})

export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
