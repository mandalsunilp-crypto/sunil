'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { ExpenseRepository } from '@/repositories/expenseRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { expenseFormSchema } from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Admin: Record new operational expense
 */
export async function adminCreateExpenseAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const file = formData.get('receiptFile') as File | null
    let receiptUrl = (formData.get('receipt_url') as string) || null

    if (file && file.size > 0) {
      const adminSupabase = createAdminClient()
      const fileName = `expense_${Date.now()}_${file.name.replace(/\s+/g, '_')}`
      const filePath = `receipts/${fileName}`

      const buffer = Buffer.from(await file.arrayBuffer())
      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('expense_receipts')
        .upload(filePath, buffer, {
          contentType: file.type || 'image/png',
          upsert: true,
        })

      if (!uploadError) {
        const { data: publicUrlData } = adminSupabase.storage
          .from('expense_receipts')
          .getPublicUrl(filePath)
        if (publicUrlData?.publicUrl) {
          receiptUrl = publicUrlData.publicUrl
        }
      }
    }

    const rawData = {
      category: formData.get('category'),
      amount: formData.get('amount'),
      description: formData.get('description'),
      expense_date: formData.get('expense_date') || new Date().toISOString().split('T')[0],
      reference: formData.get('reference') || null,
      receipt_url: receiptUrl,
    }

    const parsed = expenseFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please review expense fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await ExpenseRepository.create({
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description,
      expense_date: parsed.data.expense_date || new Date().toISOString(),
      reference: parsed.data.reference || null,
      receipt_url: parsed.data.receipt_url || null,
      created_by: user.id,
    })

    if (!result.success || !result.expense) {
      return { success: false, message: result.error || 'Failed to record expense.' }
    }

    // Audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'expense_created',
      entity_type: 'expenses',
      entity_id: result.expense.id,
      new_data: result.expense as any,
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/admin/ledger')
    revalidatePath('/admin/analytics')

    return {
      success: true,
      message: 'Expense recorded and ledger posted successfully.',
      data: result.expense,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Delete expense
 */
export async function adminDeleteExpenseAction(expenseId: string): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const result = await ExpenseRepository.delete(expenseId)
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to delete expense.' }
    }

    // Audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'expense_deleted',
      entity_type: 'expenses',
      entity_id: expenseId,
      new_data: {},
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/admin/ledger')
    revalidatePath('/admin/analytics')

    return { success: true, message: 'Expense deleted successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
