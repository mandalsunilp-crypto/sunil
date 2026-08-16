import { z } from 'zod'

export const renewalRequestSchema = z.object({
  subscriptionId: z.string().min(1, { message: 'Valid subscription ID is required.' }),
  newPlanId: z.string().min(1, { message: 'Valid plan selection is required.' }),
  renewalType: z.enum(['extend_from_current_expiry', 'start_after_current_expiry', 'replace_subscription']).default('extend_from_current_expiry'),
})

export type RenewalRequestInput = z.infer<typeof renewalRequestSchema>
