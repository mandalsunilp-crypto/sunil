import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, InvoiceStatus } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert']
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update']

export interface InvoiceWithDetails extends Invoice {
  tax_amount?: number
  apply_vat?: boolean
  billing_address?: {
    full_name?: string
    email?: string
    phone?: string
    address?: string
  }
  orders?: {
    order_number: string
    total_amount: number
    status: string
    customer_notes: string | null
    order_items?: Database['public']['Tables']['order_items']['Row'][]
    payments?: Database['public']['Tables']['payments']['Row'][]
  }
  profiles?: { full_name: string; email: string; phone: string | null }
}

export class InvoiceRepository {
  /**
   * Get all invoices for a specific customer
   */
  static async getByCustomerId(customerId: string): Promise<InvoiceWithDetails[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('invoices')
        .select('*, orders(order_number, total_amount, status, order_items(*))')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data as unknown as InvoiceWithDetails[]
      }
    } catch {
      // Fallback
    }

    return []
  }

  /**
   * Get single invoice by ID with full relations
   */
  static async getById(invoiceId: string, customerId?: string): Promise<InvoiceWithDetails | null> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('invoices')
        .select('*, orders(order_number, total_amount, status, customer_notes, order_items(*), payments(*)), profiles(full_name, email, phone)')

      if (invoiceId.startsWith('INV-')) {
        query = query.eq('invoice_number', invoiceId)
      } else {
        query = query.eq('id', invoiceId)
      }

      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data, error } = await query.single()
      if (!error && data) {
        return data as unknown as InvoiceWithDetails
      }
    } catch {
      // Fallback
    }

    // Check MemoryStore with flexible ID and invoice_number matching
    const memInv = MemoryStore.getInvoices().find(
      (i) =>
        i.id === invoiceId ||
        i.invoice_number === invoiceId ||
        i.id.startsWith(invoiceId) ||
        invoiceId.startsWith(i.id)
    )
    if (memInv) {
      const billing = memInv.billing_address || {}
      return {
        id: memInv.id,
        invoice_number: memInv.invoice_number,
        order_id: memInv.order_id,
        customer_id: memInv.customer_id,
        subtotal: memInv.subtotal,
        discount_amount: memInv.discount_amount,
        tax_amount: memInv.tax_amount || (memInv.apply_vat ? Math.round((memInv.subtotal - memInv.discount_amount) * 0.13) : 0),
        apply_vat: memInv.apply_vat,
        total_amount: memInv.total_amount,
        currency: memInv.currency,
        status: memInv.status as InvoiceStatus,
        paid_at: memInv.paid_at,
        created_at: memInv.created_at,
        updated_at: memInv.created_at,
        billing_address: memInv.billing_address,
        orders: {
          order_number: `VH-${memInv.invoice_number.replace('INV-', '')}`,
          total_amount: memInv.total_amount,
          status: memInv.status === 'paid' ? 'completed' : 'pending',
          customer_notes: 'Custom Admin Generated Invoice',
        },
        profiles: {
          full_name: billing.full_name || 'Customer',
          email: billing.email || 'customer@verifiedhub.com',
          phone: billing.phone || '+977 9714501795',
        },
      } as unknown as InvoiceWithDetails
    }

    return null
  }

  /**
   * Admin: Get all invoices with status filter and search
   */
  static async getAllAdmin(status?: string, search?: string): Promise<InvoiceWithDetails[]> {
    let remoteInvoices: InvoiceWithDetails[] = []
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('invoices')
        .select('*, orders(order_number, total_amount, status), profiles(full_name, email, phone)')
        .order('created_at', { ascending: false })

      if (status && status !== 'ALL') {
        query = query.eq('status', status as InvoiceStatus)
      }

      if (search && search.trim()) {
        const s = search.trim()
        query = query.or(`invoice_number.ilike.%${s}%`)
      }

      const { data, error } = await query
      if (!error && data) {
        remoteInvoices = (data as unknown as InvoiceWithDetails[]).map((inv) => {
          const billing = (inv as any).billing_address || {}
          return {
            ...inv,
            profiles: {
              full_name: inv.profiles?.full_name || billing.full_name || 'Walk-in Customer',
              email: inv.profiles?.email || billing.email || 'customer@verifiedhub.com',
              phone: inv.profiles?.phone || billing.phone || null,
            },
          }
        })
      }
    } catch {
      // Handled
    }

    // Merge with MemoryStore invoices
    const memInvoices = MemoryStore.getInvoices().map((memInv) => {
      const billing = memInv.billing_address || {}
      return {
        id: memInv.id,
        invoice_number: memInv.invoice_number,
        order_id: memInv.order_id,
        customer_id: memInv.customer_id,
        subtotal: memInv.subtotal,
        discount_amount: memInv.discount_amount,
        tax_amount: memInv.tax_amount || (memInv.apply_vat ? Math.round((memInv.subtotal - memInv.discount_amount) * 0.13) : 0),
        apply_vat: memInv.apply_vat,
        total_amount: memInv.total_amount,
        currency: memInv.currency,
        status: memInv.status as InvoiceStatus,
        paid_at: memInv.paid_at,
        created_at: memInv.created_at,
        updated_at: memInv.created_at,
        billing_address: memInv.billing_address,
        orders: {
          order_number: `VH-${memInv.invoice_number.replace('INV-', '')}`,
          total_amount: memInv.total_amount,
          status: memInv.status === 'paid' ? 'completed' : 'pending',
          customer_notes: 'Custom Admin Generated Invoice',
        },
        profiles: {
          full_name: billing.full_name || 'Walk-in Customer',
          email: billing.email || 'customer@verifiedhub.com',
          phone: billing.phone || '+977 9714501795',
        },
      }
    }) as unknown as InvoiceWithDetails[]

    // Combine and deduplicate
    const combined = [...memInvoices, ...remoteInvoices]
    const seen = new Set()
    return combined.filter((inv) => {
      if (seen.has(inv.id)) return false
      seen.add(inv.id)
      return true
    })
  }

  /**
   * Update invoice status
   */
  static async updateStatus(
    invoiceId: string,
    status: InvoiceStatus,
    paidAt?: string
  ): Promise<boolean> {
    const calculatedPaidAt = paidAt || (status === 'paid' ? new Date().toISOString() : null)

    // Update MemoryStore
    MemoryStore.updateInvoiceStatus(invoiceId, status, calculatedPaidAt)

    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('invoices') as any)
        .update({
          status,
          paid_at: calculatedPaidAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
    } catch {
      // Suppress
    }

    return true
  }
}
