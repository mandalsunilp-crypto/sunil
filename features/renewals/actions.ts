'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { RenewalRepository } from '@/repositories/renewalRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { renewalRequestSchema } from './schemas'
import { RenewalStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Customer Action to request subscription renewal
 */
export async function requestRenewalAction(formData: FormData): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'You must be logged in to renew your subscription.' }
    }

    const rawData = {
      subscriptionId: formData.get('subscriptionId'),
      newPlanId: formData.get('newPlanId'),
      renewalType: formData.get('renewalType') || 'extend_from_current_expiry',
    }

    const parsed = renewalRequestSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await RenewalRepository.createRenewalRequest({
      customerId: authContext.user.id,
      subscriptionId: parsed.data.subscriptionId,
      newPlanId: parsed.data.newPlanId,
      renewalType: parsed.data.renewalType,
    })

    if (!result.success || !result.renewal) {
      return {
        success: false,
        message: result.error || 'Failed to submit renewal request.',
      }
    }

    // Log audit safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: authContext.user.id,
        action: 'renewal_requested',
        entity_type: 'renewals',
        entity_id: result.renewal.id,
        new_data: result.renewal as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/dashboard/renewals')
    revalidatePath('/dashboard/subscriptions')
    revalidatePath('/admin/renewals')

    return {
      success: true,
      message: 'Renewal request submitted successfully.',
      data: result.renewal,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Server error occurred during renewal.',
    }
  }
}

/**
 * Admin Action to approve or complete a renewal
 */
export async function adminProcessRenewalAction(
  renewalId: string,
  status: RenewalStatus,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const result = await RenewalRepository.processRenewal(renewalId, status, adminNotes)

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to process renewal.',
      }
    }

    // Customer Notification & Audit Log safely
    try {
      const adminSupabase = createAdminClient()
      const { data: renewal } = await adminSupabase
        .from('renewals')
        .select('customer_id, new_expiry_date, subscriptions(subscription_number)')
        .eq('id', renewalId)
        .single()

      if (renewal && status === 'completed') {
        await adminSupabase.from('notifications').insert({
          user_id: renewal.customer_id,
          title: 'Subscription Renewed Successfully!',
          message: `Your subscription has been extended until ${new Date(renewal.new_expiry_date).toLocaleDateString()}.`,
          type: 'subscription',
          link_url: '/dashboard/subscriptions',
        })
      }

      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'renewal_processed',
        entity_type: 'renewals',
        entity_id: renewalId,
        new_data: { status, admin_notes: adminNotes },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/renewals')
    revalidatePath('/dashboard/renewals')
    revalidatePath('/dashboard/subscriptions')

    return {
      success: true,
      message: `Renewal has been marked as ${status}.`,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}
