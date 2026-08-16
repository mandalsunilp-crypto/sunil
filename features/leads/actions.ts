'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { MemoryStore, FallbackLead } from '@/lib/storage/memoryStore'

export async function adminUpdateLeadStatusAction(leadId: string, status: FallbackLead['status'], notes?: string) {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'support'])
    MemoryStore.updateLeadStatus(leadId, status, notes)
    revalidatePath('/admin/leads')
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function adminCreateLeadAction(formData: FormData) {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'support'])

    const customerName = formData.get('customerName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const interestProduct = formData.get('interestProduct') as string
    const source = (formData.get('source') as FallbackLead['source']) || 'signup'
    const notes = formData.get('notes') as string

    if (!customerName || !email) {
      return { success: false, message: 'Name and email are required.' }
    }

    MemoryStore.addLead({
      customer_name: customerName.trim(),
      email: email.trim(),
      phone: phone ? phone.trim() : undefined,
      interest_product: interestProduct ? interestProduct.trim() : undefined,
      source,
      status: 'new',
      notes: notes ? notes.trim() : undefined,
    })

    revalidatePath('/admin/leads')
    return { success: true, message: 'Lead added successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
