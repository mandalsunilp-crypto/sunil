'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'

export async function requestWalletLoadAction(formData: FormData) {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'Please sign in to load wallet funds.' }
    }

    const amount = Number(formData.get('amount')) || 0
    const paymentMethod = (formData.get('paymentMethod') as string) || 'eSewa QR'
    const referenceId = (formData.get('referenceId') as string) || ''
    const screenshotUrl = (formData.get('screenshotUrl') as string) || ''

    if (amount <= 0 || !referenceId.trim()) {
      return { success: false, message: 'Please enter a valid amount and transaction reference.' }
    }

    const wallet = MemoryStore.getWalletByCustomerId(authContext.user.id)
    MemoryStore.addWalletTransaction({
      wallet_id: wallet.id,
      customer_id: authContext.user.id,
      type: 'deposit',
      amount,
      payment_method: paymentMethod,
      reference_id: referenceId.trim(),
      screenshot_url: screenshotUrl || undefined,
      status: 'pending',
      notes: 'Customer submitted QR recharge request',
    })

    revalidatePath('/dashboard/wallet')
    revalidatePath('/admin/wallets')

    return {
      success: true,
      message: `Recharge request for Rs. ${amount} submitted! Balance will be credited upon verification.`,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error.' }
  }
}

export async function adminApproveWalletDepositAction(txId: string) {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'finance'])
    MemoryStore.approveWalletTransaction(txId)

    revalidatePath('/admin/wallets')
    revalidatePath('/dashboard/wallet')

    return { success: true, message: 'Wallet deposit approved and balance credited!' }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function adminManualWalletAdjustmentAction(formData: FormData) {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const customerId = formData.get('customerId') as string
    const amount = Number(formData.get('amount')) || 0
    const type = (formData.get('type') as 'deposit' | 'payment') || 'deposit'
    const notes = (formData.get('notes') as string) || 'Manual Admin Balance Adjustment'

    if (!customerId || amount <= 0) {
      return { success: false, message: 'Customer ID and valid amount required.' }
    }

    const wallet = MemoryStore.getWalletByCustomerId(customerId)
    MemoryStore.addWalletTransaction({
      wallet_id: wallet.id,
      customer_id: customerId,
      type: type === 'deposit' ? 'adjustment' : 'payment',
      amount,
      payment_method: 'Admin Adjustment',
      reference_id: `ADJ-${Date.now()}`,
      status: 'approved',
      notes,
    })

    revalidatePath('/admin/wallets')
    revalidatePath('/dashboard/wallet')

    return { success: true, message: 'Wallet balance adjusted successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
