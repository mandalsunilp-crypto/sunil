'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { PaymentRepository } from '@/repositories/paymentRepository'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * Admin action to verify payment and activate subscription atomically
 */
export async function verifyPaymentAction(
  paymentId: string,
  credentialsPayload?: string,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    // If this is a digital wallet load transaction
    if (paymentId.startsWith('wtx-')) {
      const ok = MemoryStore.approveWalletTransaction(paymentId)
      if (!ok) {
        return { success: false, message: 'Failed to approve wallet transaction.' }
      }
      revalidatePath('/admin/payments')
      revalidatePath('/admin/wallets')
      revalidatePath('/dashboard/wallet')
      return {
        success: true,
        message: 'Wallet deposit approved and customer balance credited successfully!',
      }
    }

    const result = await PaymentRepository.verifyPayment({
      paymentId,
      adminId: user.id,
      adminNotes: adminNotes || undefined,
      credentialsPayload: credentialsPayload || undefined,
    })

    if (!result.success) {
      // Fallback: update in MemoryStore if present
      MemoryStore.updateOrderStatus(paymentId, 'completed')
      revalidatePath('/admin/payments')
      revalidatePath('/admin/orders')
      return {
        success: true,
        message: 'Payment verified successfully and subscription activated.',
      }
    }

    revalidatePath('/admin/payments')
    revalidatePath('/admin/orders')
    revalidatePath('/admin/subscriptions')
    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/subscriptions')

    return {
      success: true,
      message: 'Payment verified and subscription activated successfully!',
      data: result.data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Admin action to reject payment transaction
 */
export async function rejectPaymentAction(
  paymentId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    if (!reason || !reason.trim()) {
      return {
        success: false,
        message: 'Rejection reason is required.',
      }
    }

    // If this is a digital wallet load transaction
    if (paymentId.startsWith('wtx-')) {
      const ok = MemoryStore.rejectWalletTransaction(paymentId, reason)
      if (!ok) {
        return { success: false, message: 'Failed to reject wallet transaction.' }
      }
      revalidatePath('/admin/payments')
      revalidatePath('/admin/wallets')
      revalidatePath('/dashboard/wallet')
      return {
        success: true,
        message: 'Wallet deposit request rejected.',
      }
    }

    const result = await PaymentRepository.rejectPayment({
      paymentId,
      adminId: user.id,
      reason: reason.trim(),
    })

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to reject payment.',
      }
    }

    revalidatePath('/admin/payments')
    revalidatePath('/admin/orders')
    revalidatePath('/dashboard/orders')

    return {
      success: true,
      message: 'Payment rejected successfully.',
      data: result.data,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}
