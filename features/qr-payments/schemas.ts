import { z } from 'zod'

export const qrPaymentMethodSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, { message: 'Display name is required (e.g. eSewa Direct QR).' }),
  accountName: z.string().trim().min(2, { message: 'Account Holder name is required.' }),
  accountNumber: z.string().trim().min(4, { message: 'Account or Mobile number is required.' }),
  qrImageUrl: z.string().trim().default('/images/qr-placeholder.png'),
  instructions: z.string().trim().optional(),
  displayOrder: z.coerce.number().int().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type QRPaymentMethodInput = z.infer<typeof qrPaymentMethodSchema>
