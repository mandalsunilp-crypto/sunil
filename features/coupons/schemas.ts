import { z } from 'zod'

export const couponFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, { message: 'Coupon code must be at least 3 characters.' })
    .max(30, { message: 'Coupon code cannot exceed 30 characters.' })
    .regex(/^[A-Z0-9_-]+$/i, { message: 'Code must contain only letters, numbers, hyphens or underscores.' }),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive({ message: 'Discount value must be greater than 0.' }),
  minimum_order_amount: z.coerce.number().min(0).default(0),
  maximum_discount: z.coerce.number().positive().optional().nullable(),
  usage_limit: z.coerce.number().int().positive().optional().nullable(),
  start_date: z.string().optional(),
  expiry_date: z.string().optional().nullable(),
  status: z.enum(['active', 'disabled', 'expired']).default('active'),
})

export type CouponFormInput = z.infer<typeof couponFormSchema>
