'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { WarrantyRepository } from '@/repositories/warrantyRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { warrantyClaimSchema, claimResolutionSchema } from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Customer Server Action to submit a warranty claim
 */
export async function submitWarrantyClaimAction(formData: FormData): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'You must be logged in to submit a warranty claim.' }
    }

    const attachmentUrl = (formData.get('attachmentUrl') as string) || undefined
    const file = formData.get('attachmentFile') as File | null
    let attachments: string[] = []

    if (file && file.size > 0) {
      try {
        const adminSupabase = createAdminClient()
        const fileName = `claim_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
        const filePath = `warranty/${fileName}`

        const buffer = Buffer.from(await file.arrayBuffer())
        const { data: uploadData, error: uploadError } = await adminSupabase.storage
          .from('warranty_attachments')
          .upload(filePath, buffer, {
            contentType: file.type || 'image/png',
            upsert: true,
          })

        if (!uploadError) {
          const { data: publicUrlData } = adminSupabase.storage
            .from('warranty_attachments')
            .getPublicUrl(filePath)
          if (publicUrlData?.publicUrl) {
            attachments.push(publicUrlData.publicUrl)
          }
        }
      } catch {
        // Suppress
      }
    }

    if (attachmentUrl && attachmentUrl.trim()) {
      attachments.push(attachmentUrl.trim())
    }

    const rawData = {
      subscriptionId: formData.get('subscriptionId'),
      reason: formData.get('reason'),
      description: formData.get('description'),
      attachmentUrl: attachments[0] || undefined,
    }

    const parsed = warrantyClaimSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please complete all required fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await WarrantyRepository.createClaim({
      customerId: authContext.user.id,
      subscriptionId: parsed.data.subscriptionId,
      reason: parsed.data.reason,
      description: parsed.data.description,
      attachments,
    })

    if (!result.success || !result.claim) {
      return {
        success: false,
        message: result.error || 'Failed to submit warranty claim.',
      }
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: authContext.user.id,
        action: 'warranty_claim_submitted',
        entity_type: 'warranty_claims',
        entity_id: result.claim.id,
        new_data: result.claim as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/dashboard/warranty')
    revalidatePath('/dashboard/subscriptions')
    revalidatePath('/admin/warranty')

    return {
      success: true,
      message: 'Warranty claim submitted successfully. Our support team will resolve it shortly.',
      data: result.claim,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Server error occurred while submitting warranty claim.',
    }
  }
}

/**
 * Admin Server Action to resolve a warranty claim
 */
export async function resolveWarrantyClaimAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'support'])

    const rawData = {
      claimId: formData.get('claimId'),
      subscriptionId: formData.get('subscriptionId'),
      status: formData.get('status'),
      actionTaken: formData.get('actionTaken'),
      adminNotes: formData.get('adminNotes') || undefined,
      newCredentialsPayload: formData.get('newCredentialsPayload') || undefined,
      extensionDays: formData.get('extensionDays') || 0,
    }

    const parsed = claimResolutionSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await WarrantyRepository.resolveClaim({
      claimId: parsed.data.claimId,
      adminId: user.id,
      status: parsed.data.status,
      actionTaken: parsed.data.actionTaken,
      adminNotes: parsed.data.adminNotes,
      newCredentialsPayload: parsed.data.newCredentialsPayload,
      extensionDays: parsed.data.extensionDays,
      subscriptionId: parsed.data.subscriptionId,
    })

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to resolve warranty claim.',
      }
    }

    // Customer Notification & Audit log safely
    try {
      const adminSupabase = createAdminClient()
      const { data: claim } = await adminSupabase
        .from('warranty_claims')
        .select('customer_id, claim_number')
        .eq('id', parsed.data.claimId)
        .single()

      if (claim) {
        await adminSupabase.from('notifications').insert({
          user_id: claim.customer_id,
          title: `Warranty Claim #${claim.claim_number} Resolved`,
          message: `Status updated to ${parsed.data.status.toUpperCase()}: ${parsed.data.actionTaken}`,
          type: 'warranty',
          link_url: '/dashboard/warranty',
        })
      }

      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'warranty_claim_resolved',
        entity_type: 'warranty_claims',
        entity_id: parsed.data.claimId,
        new_data: rawData as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/warranty')
    revalidatePath('/dashboard/warranty')
    revalidatePath('/dashboard/subscriptions')

    return {
      success: true,
      message: `Warranty claim resolved with action: ${parsed.data.status}.`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}
