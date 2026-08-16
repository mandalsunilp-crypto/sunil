'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { OrderRepository } from '@/repositories/orderRepository'
import { PaymentRepository } from '@/repositories/paymentRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { paymentSubmissionSchema } from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Customer Server Action to submit payment proof for an order
 */
export async function submitPaymentProofAction(formData: FormData): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'You must be logged in to submit payment proof.' }
    }

    const orderId = formData.get('orderId') as string
    const order = await OrderRepository.getById(orderId)

    if (!order) {
      return { success: false, message: 'Order not found.' }
    }

    if (order.customer_id !== authContext.user.id) {
      return { success: false, message: 'Unauthorized to submit payment for this order.' }
    }

    let screenshotUrl = formData.get('screenshotUrl') as string
    const file = formData.get('screenshotFile') as File | null

    // If a physical file was uploaded, upload to Supabase Storage bucket 'payment_proofs'
    if (file && file.size > 0) {
      const adminSupabase = createAdminClient()
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${order.order_number}_${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const buffer = Buffer.from(await file.arrayBuffer())

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('payment_proofs')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/png',
          upsert: true,
        })

      if (uploadError) {
        // Fallback: If bucket is not provisioned or public, store base64 data url
        const base64 = buffer.toString('base64')
        screenshotUrl = `data:${file.type || 'image/png'};base64,${base64}`
      } else {
        const { data: publicUrlData } = adminSupabase.storage
          .from('payment_proofs')
          .getPublicUrl(filePath)
        screenshotUrl = publicUrlData.publicUrl || `/receipts/${fileName}`
      }
    }

    if (!screenshotUrl) {
      screenshotUrl = '/images/payment-proof-placeholder.png'
    }

    const rawData = {
      orderId,
      paymentMethodId: formData.get('paymentMethodId') || undefined,
      amount: formData.get('amount') || order.total_amount,
      paymentReference: formData.get('paymentReference'),
      screenshotUrl,
      customerNotes: formData.get('customerNotes') || undefined,
    }

    const parsed = paymentSubmissionSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please fill in all required payment details.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await PaymentRepository.submitPaymentProof({
      orderId: parsed.data.orderId,
      customerId: authContext.user.id,
      paymentMethodId: parsed.data.paymentMethodId,
      amount: parsed.data.amount,
      paymentReference: parsed.data.paymentReference,
      screenshotUrl: parsed.data.screenshotUrl,
      customerNotes: parsed.data.customerNotes,
    })

    if (!result.success || !result.payment) {
      return {
        success: false,
        message: result.error || 'Failed to submit payment proof.',
      }
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: authContext.user.id,
        action: 'payment_proof_submitted',
        entity_type: 'payments',
        entity_id: result.payment.id,
        new_data: result.payment as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath(`/dashboard/orders/${orderId}`)
    revalidatePath('/dashboard/orders')
    revalidatePath('/admin/payments')
    revalidatePath('/admin/orders')

    return {
      success: true,
      message: 'Payment proof submitted successfully. Our team will verify it shortly.',
      data: result.payment,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Server error occurred while submitting payment proof.',
    }
  }
}
