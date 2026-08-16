'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { QRPaymentRepository, PaymentMethodStatusType } from '@/repositories/qrPaymentRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { qrPaymentMethodSchema } from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Create a new QR payment method (Admin Only)
 */
export async function createQRMethodAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const rawData = {
      name: formData.get('name'),
      accountName: formData.get('accountName'),
      accountNumber: formData.get('accountNumber'),
      qrImageUrl: formData.get('qrImageUrl') || undefined,
      instructions: formData.get('instructions') || undefined,
      displayOrder: formData.get('displayOrder') || 0,
      status: formData.get('status') || 'active',
    }

    const parsed = qrPaymentMethodSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const created = await QRPaymentRepository.create({
      name: parsed.data.name,
      account_name: parsed.data.accountName,
      account_number: parsed.data.accountNumber,
      qr_image_url: parsed.data.qrImageUrl,
      instructions: parsed.data.instructions || null,
      display_order: parsed.data.displayOrder,
      status: parsed.data.status,
    })

    if (!created) {
      return {
        success: false,
        message: 'Failed to create QR payment method.',
      }
    }

    // Log audit log
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'qr_method_created',
        entity_type: 'qr_payment_methods',
        entity_id: created.id,
        new_data: created as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/qr-payments')
    revalidatePath('/dashboard/orders')

    return {
      success: true,
      message: 'QR Payment method added successfully.',
      data: created,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Update an existing QR payment method (Admin Only)
 */
export async function updateQRMethodAction(methodId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const rawData = {
      name: formData.get('name'),
      accountName: formData.get('accountName'),
      accountNumber: formData.get('accountNumber'),
      qrImageUrl: formData.get('qrImageUrl') || undefined,
      instructions: formData.get('instructions') || undefined,
      displayOrder: formData.get('displayOrder') || 0,
      status: formData.get('status') || 'active',
    }

    const parsed = qrPaymentMethodSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const updated = await QRPaymentRepository.update(methodId, {
      name: parsed.data.name,
      account_name: parsed.data.accountName,
      account_number: parsed.data.accountNumber,
      qr_image_url: parsed.data.qrImageUrl,
      instructions: parsed.data.instructions || null,
      display_order: parsed.data.displayOrder,
      status: parsed.data.status,
    })

    if (!updated) {
      return {
        success: false,
        message: 'Failed to update QR payment method.',
      }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'qr_method_updated',
        entity_type: 'qr_payment_methods',
        entity_id: methodId,
        new_data: updated as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/qr-payments')
    revalidatePath('/dashboard/orders')

    return {
      success: true,
      message: 'QR Payment method updated successfully.',
      data: updated,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Delete a QR payment method (Admin Only)
 */
export async function deleteQRMethodAction(methodId: string): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const success = await QRPaymentRepository.delete(methodId)
    if (!success) {
      return {
        success: false,
        message: 'Failed to delete QR method.',
      }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'qr_method_deleted',
        entity_type: 'qr_payment_methods',
        entity_id: methodId,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/qr-payments')
    return {
      success: true,
      message: 'Payment method deleted successfully.',
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Toggle QR Method Status
 */
export async function toggleQRMethodStatusAction(methodId: string, currentStatus: string): Promise<ActionResult> {
  try {
    await AuthService.requireRole(['super_admin', 'admin'])
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const success = await QRPaymentRepository.updateStatus(methodId, nextStatus as any)
    if (!success) return { success: false, message: 'Failed to update status.' }
    revalidatePath('/admin/qr-payments')
    return { success: true, message: `Status updated to ${nextStatus}.` }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
