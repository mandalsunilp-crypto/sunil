import { z } from 'zod'

export const paymentSubmissionSchema = z.object({
  orderId: z.string().min(1, { message: 'Order ID is required.' }),
  paymentMethodId: z.string().optional(),
  amount: z.coerce.number().min(1, { message: 'Payable amount must be greater than 0.' }),
  paymentReference: z.string().trim().min(2, { message: 'Transaction reference or Remarks is required.' }),
  screenshotUrl: z.string().trim().min(1, { message: 'Payment screenshot proof is required.' }),
  customerNotes: z.string().trim().optional(),
})

export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>
