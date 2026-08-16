import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type QRPaymentMethod = Database['public']['Tables']['qr_payment_methods']['Row']
export type QRPaymentMethodInsert = Database['public']['Tables']['qr_payment_methods']['Insert']
export type QRPaymentMethodUpdate = Database['public']['Tables']['qr_payment_methods']['Update']

export type PaymentMethodStatusType = 'active' | 'inactive'

export class QRPaymentRepository {
  /**
   * Get all active QR payment methods for customer checkout & payment screens
   */
  static async getActiveMethods(): Promise<QRPaymentMethod[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('qr_payment_methods')
        .select('*')
        .eq('status', 'active')
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) {
        return data as QRPaymentMethod[]
      }
    } catch {
      // Fallback
    }

    const fallbacks = MemoryStore.getQRMethods().filter((m) => m.status === 'active')
    return fallbacks as unknown as QRPaymentMethod[]
  }

  /**
   * Get all QR payment methods for admin panel
   */
  static async getAllAdmin(): Promise<QRPaymentMethod[]> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('qr_payment_methods')
        .select('*')
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) {
        return data as QRPaymentMethod[]
      }
    } catch {
      // Fallback
    }

    const fallbacks = MemoryStore.getQRMethods()
    return fallbacks as unknown as QRPaymentMethod[]
  }

  /**
   * Get payment method by ID
   */
  static async getById(id: string): Promise<QRPaymentMethod | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('qr_payment_methods')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        return data as QRPaymentMethod
      }
    } catch {
      // Fallback
    }

    const found = MemoryStore.getQRMethods().find((m) => m.id === id)
    return (found as unknown as QRPaymentMethod) || null
  }

  /**
   * Create new QR payment method (Admin Only)
   */
  static async create(payload: QRPaymentMethodInsert): Promise<QRPaymentMethod | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await (adminSupabase.from('qr_payment_methods') as any)
        .insert(payload)
        .select('*')
        .single()

      if (!error && data) {
        return data as QRPaymentMethod
      }
    } catch {
      // Fallback
    }

    const created = MemoryStore.addQRMethod({
      name: payload.name,
      account_name: payload.account_name,
      account_number: payload.account_number,
      qr_image_url: payload.qr_image_url || '/images/qr-placeholder.png',
      instructions: payload.instructions || null,
      display_order: payload.display_order || 0,
      status: payload.status || 'active',
    })

    return created as unknown as QRPaymentMethod
  }

  /**
   * Update QR payment method (Admin Only)
   */
  static async update(id: string, payload: QRPaymentMethodUpdate): Promise<QRPaymentMethod | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await (adminSupabase.from('qr_payment_methods') as any)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (!error && data) {
        return data as QRPaymentMethod
      }
    } catch {
      // Fallback
    }

    MemoryStore.updateQRMethod(id, {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.account_name ? { account_name: payload.account_name } : {}),
      ...(payload.account_number ? { account_number: payload.account_number } : {}),
      ...(payload.qr_image_url ? { qr_image_url: payload.qr_image_url } : {}),
      ...(payload.instructions !== undefined ? { instructions: payload.instructions } : {}),
      ...(payload.display_order !== undefined ? { display_order: payload.display_order } : {}),
      ...(payload.status ? { status: payload.status } : {}),
    })

    return this.getById(id)
  }

  /**
   * Update status (active / inactive)
   */
  static async updateStatus(id: string, status: PaymentMethodStatusType): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('qr_payment_methods') as any)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    } catch {
      // Suppress
    }

    MemoryStore.updateQRMethod(id, { status })
    return true
  }

  /**
   * Delete QR payment method
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('qr_payment_methods').delete().eq('id', id)
    } catch {
      // Suppress
    }

    MemoryStore.deleteQRMethod(id)
    return true
  }
}
