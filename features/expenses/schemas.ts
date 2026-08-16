import { z } from 'zod'

export const expenseFormSchema = z.object({
  category: z.enum([
    'advertising',
    'software',
    'operations',
    'payment_fees',
    'refund_costs',
    'warranty_costs',
    'other',
  ]),
  amount: z.coerce.number().positive({ message: 'Amount must be greater than 0.' }),
  description: z.string().trim().min(3, { message: 'Description must be at least 3 characters.' }),
  expense_date: z.string().optional(),
  reference: z.string().trim().optional().nullable(),
  receipt_url: z.string().trim().optional().nullable(),
})

export type ExpenseFormInput = z.infer<typeof expenseFormSchema>
