import { z } from 'zod'

export const warrantyClaimSchema = z.object({
  subscriptionId: z.string().min(1, { message: 'Valid subscription ID is required.' }),
  reason: z.string().trim().min(3, { message: 'Reason / Issue title is required.' }),
  description: z.string().trim().min(10, { message: 'Please describe the problem in at least 10 characters.' }),
  attachmentUrl: z.string().trim().optional(),
})

export type WarrantyClaimInput = z.infer<typeof warrantyClaimSchema>

export const claimResolutionSchema = z.object({
  claimId: z.string().min(1, { message: 'Valid claim ID is required.' }),
  subscriptionId: z.string().min(1, { message: 'Valid subscription ID is required.' }),
  status: z.enum(['under_review', 'approved', 'rejected', 'replaced', 'reactivated', 'extended', 'closed']),
  actionTaken: z.string().trim().min(2, { message: 'Action summary is required.' }),
  adminNotes: z.string().trim().optional(),
  newCredentialsPayload: z.string().trim().optional(),
  extensionDays: z.coerce.number().int().min(0).default(0),
})

export type ClaimResolutionInput = z.infer<typeof claimResolutionSchema>
