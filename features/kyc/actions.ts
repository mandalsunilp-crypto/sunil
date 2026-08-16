'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { MemoryStore, FallbackKYC } from '@/lib/storage/memoryStore'

export async function submitCustomerKYCAction(formData: FormData) {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'Please sign in to submit KYC verification.' }
    }

    const documentType = (formData.get('documentType') as FallbackKYC['document_type']) || 'citizenship'
    const documentNumber = (formData.get('documentNumber') as string) || ''
    const documentFrontUrl = (formData.get('documentFrontUrl') as string) || ''
    const documentBackUrl = (formData.get('documentBackUrl') as string) || ''

    if (!documentNumber.trim() || !documentFrontUrl) {
      return { success: false, message: 'Please provide document number and upload front photo.' }
    }

    MemoryStore.submitKYC({
      customer_id: authContext.user.id,
      customer_name: authContext.profile?.full_name || 'Customer',
      customer_email: authContext.user.email || 'user@verifiedhub.com',
      document_type: documentType,
      document_number: documentNumber.trim(),
      document_front_url: documentFrontUrl,
      document_back_url: documentBackUrl || undefined,
    })

    revalidatePath('/dashboard/kyc')
    revalidatePath('/dashboard/profile')
    revalidatePath('/admin/kyc')

    return {
      success: true,
      message: 'KYC documents submitted successfully! Our compliance team will review them within 24 hours.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error.' }
  }
}

export async function adminReviewKYCAction(kycId: string, status: 'verified' | 'rejected', notes?: string) {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'support'])

    MemoryStore.updateKYCStatus(kycId, status, notes)

    revalidatePath('/admin/kyc')
    revalidatePath('/dashboard/kyc')

    return {
      success: true,
      message: `KYC status updated to ${status}.`,
    }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
