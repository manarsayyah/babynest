import { z } from "zod"
import { objectIdSchema } from "@/lib/validation/shared"

export const createProductTagSchema = z.object({
  tagId: objectIdSchema,
})

export type CreateProductTagInput = z.infer<typeof createProductTagSchema>
