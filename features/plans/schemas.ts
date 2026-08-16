import { z } from 'zod'

export const planSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, { message: 'Valid product ID is required.' }),
  name: z.string().trim().min(2, { message: 'Plan name must be at least 2 characters.' }),
  durationDays: z.coerce.number().int().min(1, { message: 'Duration must be at least 1 day.' }),
  sellingPrice: z.coerce.number().min(0, { message: 'Selling price must be greater than or equal to 0.' }),
  investmentCost: z.coerce.number().min(0, { message: 'Investment cost must be greater than or equal to 0.' }).default(0),
  warrantyDays: z.coerce.number().int().min(0, { message: 'Warranty days cannot be negative.' }).default(0),
  stock: z.coerce.number().int().default(-1), // -1 for unlimited
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
})

export type PlanInput = z.infer<typeof planSchema>
