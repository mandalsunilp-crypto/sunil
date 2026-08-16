'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { OrderRepository } from '@/repositories/orderRepository'
import { PlanRepository } from '@/repositories/planRepository'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * Customer Server Action to create order
 */
export async function createOrderAction(formData: FormData): Promise<ActionResult<{ orderId: string }>> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'You must be logged in to place an order.' }
    }

    const productId = formData.get('productId') as string
    const planId = formData.get('planId') as string
    const couponCode = (formData.get('couponCode') as string) || undefined
    const customerNotes = (formData.get('customerNotes') as string) || undefined
    const paymentMethod = (formData.get('paymentMethod') as string) || 'qr'
    const idempotencyKey = (formData.get('idempotencyKey') as string) || undefined

    if (!productId || !planId) {
      return { success: false, message: 'Product and Plan selection are required.' }
    }

    const result = await OrderRepository.createSecureOrder({
      customerId: authContext.user.id,
      productId,
      planId,
      couponCode,
      customerNotes,
      idempotencyKey,
    })

    if (!result.success || !result.order_id) {
      return {
        success: false,
        message: result.error || 'Failed to place order. Please try again.',
      }
    }

    // If customer selected 1-Click Digital Wallet Payment
    if (paymentMethod === 'wallet') {
      const wallet = MemoryStore.getWalletByCustomerId(authContext.user.id)
      const orderTotal = result.total_amount || 2500

      if (wallet.balance < orderTotal) {
        return {
          success: false,
          message: `Insufficient wallet balance (Rs. ${wallet.balance}). Please load money or choose QR Payment.`,
        }
      }

      // Deduct wallet balance and add approved wallet payment transaction
      wallet.balance -= orderTotal
      MemoryStore.addWalletTransaction({
        wallet_id: wallet.id,
        customer_id: authContext.user.id,
        type: 'payment',
        amount: orderTotal,
        payment_method: 'Digital Wallet',
        reference_id: result.order_number || result.order_id,
        status: 'approved',
        notes: `Paid for order ${result.order_number || result.order_id}`,
      })

      // Mark order as verified
      MemoryStore.updateOrderStatus(result.order_id, 'payment_verified')

      // Record verified payment
      MemoryStore.addPayment({
        order_id: result.order_id,
        customer_id: authContext.user.id,
        payment_method_id: null,
        amount: orderTotal,
        currency: 'NPR',
        payment_reference: `WALLET-${result.order_number || result.order_id}`,
        screenshot_url: '',
        status: 'verified',
        customer_notes: customerNotes || 'Paid via Digital Wallet',
        admin_notes: 'Instant verified via customer digital wallet balance',
        verified_by: 'system',
        submitted_at: new Date().toISOString(),
        verified_at: new Date().toISOString(),
      })

      // Auto-create and activate subscription
      const plan = await PlanRepository.getById(planId)
      const durationDays = plan?.duration_days || 30
      const warrantyDays = plan?.warranty_days || durationDays

      const startsAt = new Date()
      const expiresAt = new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000)
      const warrantyExpiresAt = new Date(startsAt.getTime() + warrantyDays * 24 * 60 * 60 * 1000)

      MemoryStore.addSubscription({
        subscription_number: `SUB-${result.order_number || result.order_id.slice(-6).toUpperCase()}`,
        order_id: result.order_id,
        customer_id: authContext.user.id,
        product_id: productId,
        plan_id: planId,
        status: 'active',
        activation_date: startsAt.toISOString(),
        expiry_date: expiresAt.toISOString(),
        warranty_start: startsAt.toISOString(),
        warranty_expiry: warrantyExpiresAt.toISOString(),
        credentials_payload: JSON.stringify({
          instructions: 'Your AI subscription credentials will be delivered via email and WhatsApp within 5 minutes.',
        }),
        renewal_count: 0,
        last_renewed_at: null,
      })
    }

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard/subscriptions')
    revalidatePath('/dashboard/wallet')
    revalidatePath('/dashboard')
    revalidatePath('/admin/orders')
    revalidatePath('/admin/payments')
    revalidatePath('/admin/subscriptions')

    return {
      success: true,
      message: paymentMethod === 'wallet' ? 'Order paid and subscription activated instantly!' : 'Order created successfully.',
      data: { orderId: result.order_id },
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Server error occurred during checkout.',
    }
  }
}

/**
 * Cancel a pending order
 */
export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'Unauthorized.' }
    }

    const order = await OrderRepository.getById(orderId)
    if (!order) {
      return { success: false, message: 'Order not found.' }
    }

    const isStaff = authContext.profile?.role && authContext.profile.role !== 'customer'
    if (!isStaff && order.customer_id !== authContext.user.id) {
      return { success: false, message: 'Unauthorized to cancel this order.' }
    }

    if (order.status !== 'pending' && order.status !== 'awaiting_payment') {
      return { success: false, message: 'Only pending orders can be cancelled.' }
    }

    const ok = await OrderRepository.updateStatus(orderId, 'cancelled', 'Cancelled by customer/admin')
    if (!ok) {
      return { success: false, message: 'Failed to cancel order.' }
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: authContext.user.id,
        action: 'order_cancelled',
        entity_type: 'orders',
        entity_id: orderId,
        new_data: { status: 'cancelled' },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/dashboard/orders')
    revalidatePath('/dashboard')
    revalidatePath('/admin/orders')

    return { success: true, message: 'Order cancelled successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error.' }
  }
}

/**
 * Admin: Update order status
 */
export async function adminUpdateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  adminNotes?: string
): Promise<ActionResult> {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'support'])
    const ok = await OrderRepository.updateStatus(orderId, status, adminNotes)
    if (!ok) {
      return { success: false, message: 'Failed to update order status.' }
    }
    revalidatePath('/admin/orders')
    revalidatePath('/admin/payments')
    revalidatePath('/dashboard/orders')
    return { success: true, message: 'Order status updated successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update order status.' }
  }
}
