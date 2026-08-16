'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { CouponRepository, CouponValidationResult } from '@/repositories/couponRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { couponFormSchema } from './schemas'
import { CouponStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Validate coupon code (Customer or Checkout)
 */
export async function validateCouponCodeAction(
  code: string,
  subtotal: number
): Promise<CouponValidationResult> {
  const authContext = await AuthService.getCurrentUser()
  return CouponRepository.validateCoupon(code, subtotal, authContext?.user?.id)
}

/**
 * Admin: Create coupon
 */
export async function adminCreateCouponAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const rawData = {
      code: formData.get('code'),
      type: formData.get('type'),
      value: formData.get('value'),
      minimum_order_amount: formData.get('minimum_order_amount') || 0,
      maximum_discount: formData.get('maximum_discount') || null,
      usage_limit: formData.get('usage_limit') || null,
      start_date: formData.get('start_date') || new Date().toISOString(),
      expiry_date: formData.get('expiry_date') || null,
      status: formData.get('status') || 'active',
    }

    const parsed = couponFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please review coupon fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await CouponRepository.create({
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      minimum_order_amount: parsed.data.minimum_order_amount,
      maximum_discount: parsed.data.maximum_discount || null,
      usage_limit: parsed.data.usage_limit || null,
      start_date: parsed.data.start_date || new Date().toISOString(),
      expiry_date: parsed.data.expiry_date || null,
      status: parsed.data.status,
    })

    if (!result.success || !result.coupon) {
      return {
        success: false,
        message: result.error || 'Failed to create coupon.',
      }
    }

    // Log audit log
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'coupon_created',
        entity_type: 'coupons',
        entity_id: result.coupon.id,
        new_data: result.coupon as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/coupons')

    return {
      success: true,
      message: `Coupon ${result.coupon.code} created successfully.`,
      data: result.coupon,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Admin: Update coupon
 */
export async function adminUpdateCouponAction(
  couponId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const rawData = {
      code: formData.get('code'),
      type: formData.get('type'),
      value: formData.get('value'),
      minimum_order_amount: formData.get('minimum_order_amount') || 0,
      maximum_discount: formData.get('maximum_discount') || null,
      usage_limit: formData.get('usage_limit') || null,
      start_date: formData.get('start_date') || new Date().toISOString(),
      expiry_date: formData.get('expiry_date') || null,
      status: formData.get('status') || 'active',
    }

    const parsed = couponFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please review coupon fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await CouponRepository.update(couponId, {
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      minimum_order_amount: parsed.data.minimum_order_amount,
      maximum_discount: parsed.data.maximum_discount || null,
      usage_limit: parsed.data.usage_limit || null,
      start_date: parsed.data.start_date || new Date().toISOString(),
      expiry_date: parsed.data.expiry_date || null,
      status: parsed.data.status,
    })

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to update coupon.',
      }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'coupon_updated',
        entity_type: 'coupons',
        entity_id: couponId,
        new_data: rawData as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/coupons')

    return {
      success: true,
      message: 'Coupon updated successfully.',
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Admin: Toggle coupon status
 */
export async function adminToggleCouponStatusAction(
  couponId: string,
  status: CouponStatus
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const result = await CouponRepository.update(couponId, { status })
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to update status.' }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'coupon_status_toggled',
        entity_type: 'coupons',
        entity_id: couponId,
        new_data: { status },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/coupons')

    return { success: true, message: `Coupon status changed to ${status}.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
