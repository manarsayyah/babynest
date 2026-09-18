import { z } from "zod"

const ADDRESS_LABELS = ["Home", "Work", "Other"] as const

export const createAddressSchema = z.object({
  label: z.enum(ADDRESS_LABELS).optional(),
  fullName: z.string().trim().min(1, "Full name is required.").max(150),
  phone: z.string().trim().min(1, "Phone is required.").max(30),
  street: z.string().trim().min(1, "Street is required.").max(200, "Street must be at most 200 characters."),
  apartment: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1, "City is required.").max(100, "City must be at most 100 characters."),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(1, "Country is required.").max(100, "Country must be at most 100 characters."),
  isDefault: z.boolean().optional(),
})

export const updateAddressSchema = z.object({
  label: z.enum(ADDRESS_LABELS).optional(),
  fullName: z.string().trim().min(1).max(150).optional(),
  phone: z.string().trim().min(1).max(30).optional(),
  street: z.string().trim().min(1).max(200).optional(),
  apartment: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
})

export type CreateAddressInput = z.infer<typeof createAddressSchema>
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>
