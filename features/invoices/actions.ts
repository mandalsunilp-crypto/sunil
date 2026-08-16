'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { InvoiceRepository } from '@/repositories/invoiceRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { InvoiceStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * Admin action to update invoice status
 */
export async function adminUpdateInvoiceStatusAction(
  invoiceId: string,
  status: InvoiceStatus
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const ok = await InvoiceRepository.updateStatus(invoiceId, status)
    if (!ok) {
      return { success: false, message: 'Failed to update invoice status.' }
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'invoice_status_updated',
        entity_type: 'invoices',
        entity_id: invoiceId,
        new_data: { status },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/invoices')
    revalidatePath('/dashboard/invoices')
    revalidatePath(`/invoices/${invoiceId}`)

    return { success: true, message: `Invoice status updated to ${status}.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
