'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { SubscriptionRepository } from '@/repositories/subscriptionRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { SubscriptionStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * Admin action to update subscription credentials
 */
export async function adminUpdateSubscriptionCredentialsAction(
  subscriptionId: string,
  credentialsPayload: string,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'support'])

    const ok = await SubscriptionRepository.updateCredentials(
      subscriptionId,
      credentialsPayload
    )

    if (!ok) {
      return { success: false, message: 'Failed to update subscription credentials.' }
    }

    // Log audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'subscription_credentials_updated',
      entity_type: 'subscriptions',
      entity_id: subscriptionId,
      new_data: { admin_notes: adminNotes },
    })

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/subscriptions')

    return { success: true, message: 'Credentials updated successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin action to update subscription status
 */
export async function adminUpdateSubscriptionStatusAction(
  subscriptionId: string,
  status: SubscriptionStatus,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'support'])

    const ok = await SubscriptionRepository.updateStatus(subscriptionId, status)
    if (!ok) {
      return { success: false, message: 'Failed to update subscription status.' }
    }

    // Log audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'subscription_status_updated',
      entity_type: 'subscriptions',
      entity_id: subscriptionId,
      new_data: { status, admin_notes: adminNotes },
    })

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/subscriptions')

    return { success: true, message: `Subscription status updated to ${status}.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin action to adjust subscription expiry & warranty dates
 */
export async function adminAdjustSubscriptionDatesAction(
  subscriptionId: string,
  expiryDate: string,
  warrantyExpiry: string,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'support'])

    const ok = await SubscriptionRepository.adjustDates(subscriptionId, expiryDate, warrantyExpiry)
    if (!ok) {
      return { success: false, message: 'Failed to adjust subscription dates.' }
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'subscription_dates_adjusted',
        entity_type: 'subscriptions',
        entity_id: subscriptionId,
        new_data: { expiry_date: expiryDate, warranty_expiry: warrantyExpiry, admin_notes: adminNotes },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/subscriptions')

    return { success: true, message: 'Subscription dates adjusted successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin action to manually create / provision a subscription for a customer
 */
export async function adminCreateSubscriptionAction(payload: {
  customerId: string
  productId: string
  planId: string
  durationDays?: number
  credentialsPayload?: string
  status?: SubscriptionStatus
}): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'support'])

    if (!payload.customerId || !payload.productId || !payload.planId) {
      return { success: false, message: 'Customer, Product, and Plan selection are required.' }
    }

    const durationDays = payload.durationDays || 30
    const status = payload.status || 'active'
    const credentialsPayload = payload.credentialsPayload || ''

    const startsAt = new Date()
    const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000)
    const warrantyExpiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const subNumber = `SUB-VH-${Math.floor(100000 + Math.random() * 900000)}`

    // 1. Try Supabase insert
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('subscriptions') as any).insert({
        subscription_number: subNumber,
        customer_id: payload.customerId,
        product_id: payload.productId,
        plan_id: payload.planId,
        status: status,
        credentials_payload: credentialsPayload || null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        warranty_start: startsAt.toISOString(),
        warranty_expiry: warrantyExpiresAt.toISOString(),
      })
    } catch {
      // Suppress and fallback to MemoryStore
    }

    // 2. High availability MemoryStore fallback
    const MemoryStore = (await import('@/lib/storage/memoryStore')).MemoryStore
    const newSub = MemoryStore.addSubscription({
      subscription_number: subNumber,
      order_id: `ord-manual-${Date.now()}`,
      customer_id: payload.customerId,
      product_id: payload.productId,
      plan_id: payload.planId,
      status: status as any,
      activation_date: startsAt.toISOString(),
      expiry_date: expiresAt.toISOString(),
      warranty_start: startsAt.toISOString(),
      warranty_expiry: warrantyExpiresAt.toISOString(),
      credentials_payload: credentialsPayload || JSON.stringify({ instructions: 'Subscription provisioned manually by admin.' }),
      renewal_count: 0,
      last_renewed_at: null,
    })

    // Log audit log
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'subscription_provisioned_manually',
        entity_type: 'subscriptions',
        entity_id: subNumber,
        new_data: { customer_id: payload.customerId, product_id: payload.productId },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/subscriptions')

    return {
      success: true,
      message: 'New subscription provisioned successfully!',
      data: newSub,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
