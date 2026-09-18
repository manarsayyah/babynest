import { z } from "zod"
import { objectIdSchema, slugSchema } from "@/lib/validation/shared"

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200, "Name must be at most 200 characters."),
  slug: slugSchema,
  description: z.string().trim().max(5000).optional(),
  brand: z.string().trim().max(100).optional(),
  material: z.string().trim().max(200).optional(),
  ageGroup: z.string().trim().max(50).optional(),
  price: z.number().min(0, "Price must be 0 or greater."),
  stock: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: objectIdSchema,
})

// Same allow-list as create, all optional — protected/internal fields
// (_id, createdAt, updatedAt, deletedAt) are never part of this schema, so
// they can never be set from a request body.
export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: slugSchema.optional(),
  description: z.string().trim().max(5000).optional(),
  brand: z.string().trim().max(100).optional(),
  material: z.string().trim().max(200).optional(),
  ageGroup: z.string().trim().max(50).optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewCount: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  categoryId: objectIdSchema.optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
