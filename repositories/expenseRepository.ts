import { createAdminClient } from '@/lib/supabase/admin'
import { Database, ExpenseCategory } from '@/types/database.types'
import { LedgerRepository } from './ledgerRepository'

export type Expense = Database['public']['Tables']['expenses']['Row']
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert']
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update']

export interface ExpenseWithProfile extends Expense {
  profiles?: { full_name: string; email: string }
}

export class ExpenseRepository {
  /**
   * Admin: Get all expenses
   */
  static async getAllAdmin(category?: string, search?: string): Promise<ExpenseWithProfile[]> {
    const adminSupabase = createAdminClient()
    let query = adminSupabase
      .from('expenses')
      .select('*, profiles:created_by(full_name, email)')
      .order('expense_date', { ascending: false })

    if (category && category !== 'ALL') {
      query = query.eq('category', category as ExpenseCategory)
    }

    if (search && search.trim()) {
      const s = search.trim()
      query = query.or(`description.ilike.%${s}%,reference.ilike.%${s}%`)
    }

    const { data, error } = await query
    if (error || !data) {
      return []
    }

    return data as unknown as ExpenseWithProfile[]
  }

  /**
   * Admin: Create expense and post double-entry to ledger
   */
  static async create(payload: ExpenseInsert): Promise<{ success: boolean; expense?: Expense; error?: string }> {
    const adminSupabase = createAdminClient()

    const { data: expense, error } = await adminSupabase
      .from('expenses')
      .insert(payload)
      .select('*')
      .single()

    if (error || !expense) {
      return { success: false, error: error?.message || 'Failed to record expense.' }
    }

    // Auto double-entry posting: Debit Operating/Warranty Expense, Credit Cash/Bank
    const expenseAccount: 'warranty_expense' | 'operating_expense' =
      payload.category === 'warranty_costs' ? 'warranty_expense' : 'operating_expense'
    await LedgerRepository.postDoubleEntry({
      transactionId: expense.id,
      debitAccount: expenseAccount,
      creditAccount: 'cash_bank',
      amount: expense.amount,
      description: `Expense: ${expense.category.toUpperCase()} - ${expense.description}`,
      referenceEntityType: 'expenses',
      referenceEntityId: expense.id,
      createdBy: payload.created_by,
    })

    return { success: true, expense: expense as Expense }
  }

  /**
   * Admin: Delete expense
   */
  static async delete(expenseId: string): Promise<{ success: boolean; error?: string }> {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from('expenses').delete().eq('id', expenseId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Also clean up ledger entries
    await adminSupabase.from('ledger_entries').delete().eq('reference_entity_id', expenseId)

    return { success: true }
  }
}
