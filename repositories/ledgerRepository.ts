import { createAdminClient } from '@/lib/supabase/admin'
import { Database, LedgerAccount, LedgerEntryType } from '@/types/database.types'

export type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row']
export type LedgerEntryInsert = Database['public']['Tables']['ledger_entries']['Insert']

export interface LedgerSummary {
  totalDebits: number
  totalCredits: number
  isBalanced: boolean
  accountBalances: Record<string, { debit: number; credit: number; net: number }>
}

export class LedgerRepository {
  /**
   * Get all ledger entries with optional filters
   */
  static async getAllAdmin(account?: string, type?: string, search?: string): Promise<LedgerEntry[]> {
    const adminSupabase = createAdminClient()
    let query = adminSupabase
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (account && account !== 'ALL') {
      query = query.eq('account', account as LedgerAccount)
    }

    if (type && type !== 'ALL') {
      query = query.eq('type', type as LedgerEntryType)
    }

    if (search && search.trim()) {
      const s = search.trim()
      query = query.ilike('description', `%${s}%`)
    }

    const { data, error } = await query
    if (error || !data) {
      return []
    }

    return data as LedgerEntry[]
  }

  /**
   * Post a balanced double-entry transaction
   */
  static async postDoubleEntry(payload: {
    transactionId: string
    debitAccount: LedgerAccount
    creditAccount: LedgerAccount
    amount: number
    description: string
    referenceEntityType?: string
    referenceEntityId?: string
    createdBy?: string
  }): Promise<{ success: boolean; error?: string }> {
    const adminSupabase = createAdminClient()

    const entries: LedgerEntryInsert[] = [
      {
        transaction_id: payload.transactionId,
        account: payload.debitAccount,
        type: 'debit',
        amount: payload.amount,
        description: payload.description,
        reference_entity_type: payload.referenceEntityType || null,
        reference_entity_id: payload.referenceEntityId || null,
        created_by: payload.createdBy || null,
      },
      {
        transaction_id: payload.transactionId,
        account: payload.creditAccount,
        type: 'credit',
        amount: payload.amount,
        description: payload.description,
        reference_entity_type: payload.referenceEntityType || null,
        reference_entity_id: payload.referenceEntityId || null,
        created_by: payload.createdBy || null,
      },
    ]

    const { error } = await adminSupabase.from('ledger_entries').insert(entries)
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Get ledger balance summary
   */
  static async getSummary(): Promise<LedgerSummary> {
    const entries = await this.getAllAdmin()

    let totalDebits = 0
    let totalCredits = 0
    const accountBalances: Record<string, { debit: number; credit: number; net: number }> = {}

    for (const e of entries) {
      const amt = Number(e.amount)
      if (!accountBalances[e.account]) {
        accountBalances[e.account] = { debit: 0, credit: 0, net: 0 }
      }

      if (e.type === 'debit') {
        totalDebits += amt
        accountBalances[e.account].debit += amt
        accountBalances[e.account].net += amt
      } else {
        totalCredits += amt
        accountBalances[e.account].credit += amt
        accountBalances[e.account].net -= amt
      }
    }

    return {
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      accountBalances,
    }
  }
}
