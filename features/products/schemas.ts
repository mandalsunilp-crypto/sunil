import { z } from 'zod'

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, { message: 'Product name must be at least 2 characters.' }),
  slug: z.string().trim().min(2, { message: 'Slug must be at least 2 characters.' }),
  description: z.string().trim().optional(),
  category: z.string().trim().min(1, { message: 'Category is required.' }),
  imageUrl: z.string().url().optional().or(z.literal('')),
  features: z.array(z.string()).default([]),
  displayOrder: z.coerce.number().int().default(0),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
})

export type ProductInput = z.infer<typeof productSchema>
