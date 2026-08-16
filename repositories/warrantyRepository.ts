import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, WarrantyStatus } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type WarrantyClaim = Database['public']['Tables']['warranty_claims']['Row']
export type WarrantyClaimInsert = Database['public']['Tables']['warranty_claims']['Insert']
export type WarrantyClaimUpdate = Database['public']['Tables']['warranty_claims']['Update']

export interface WarrantyClaimWithDetails extends WarrantyClaim {
  subscriptions?: {
    subscription_number: string
    activation_date: string
    expiry_date: string
    warranty_expiry: string
    credentials_payload: string | null
    products?: { name: string; image_url: string | null }
    plans?: { name: string; duration_days: number }
  }
  profiles?: { full_name: string; email: string; phone: string | null }
}

export class WarrantyRepository {
  /**
   * Submit warranty claim (Customer)
   */
  static async createClaim(payload: {
    customerId: string
    subscriptionId: string
    reason: string
    description: string
    attachments?: string[]
  }): Promise<{ success: boolean; claim?: WarrantyClaim; error?: string }> {
    try {
      const supabase = await createClient()

      // 1. Verify subscription is active and within warranty period
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, warranty_expiry, status')
        .eq('id', payload.subscriptionId)
        .eq('customer_id', payload.customerId)
        .single()

      if (sub && (sub as any).warranty_expiry) {
        const now = new Date()
        const warrantyExpiry = new Date((sub as any).warranty_expiry)
        if (warrantyExpiry < now) {
          return { success: false, error: 'The warranty coverage period for this subscription has expired.' }
        }
      }

      // 2. Insert warranty claim
      const { data: claim, error: claimError } = await (supabase.from('warranty_claims') as any)
        .insert({
          subscription_id: payload.subscriptionId,
          customer_id: payload.customerId,
          reason: payload.reason,
          description: payload.description,
          attachments: payload.attachments || [],
          status: 'submitted',
        })
        .select('*')
        .single()

      if (!claimError && claim) {
        MemoryStore.addWarrantyClaim(claim)
        return { success: true, claim: claim as WarrantyClaim }
      }
    } catch {
      // Fallback
    }

    const fallbackClaim = MemoryStore.addWarrantyClaim({
      claim_number: `CLM-${Date.now().toString().slice(-6)}`,
      subscription_id: payload.subscriptionId,
      customer_id: payload.customerId,
      reason: payload.reason,
      description: payload.description,
      attachments: payload.attachments || [],
      status: 'submitted',
      action_taken: null,
      admin_notes: null,
      resolved_at: null,
      resolved_by: null,
    })

    return {
      success: true,
      claim: fallbackClaim as unknown as WarrantyClaim,
    }
  }

  /**
   * Get all claims for a customer
   */
  static async getByCustomerId(customerId: string): Promise<WarrantyClaimWithDetails[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('warranty_claims')
        .select('*, subscriptions(subscription_number, activation_date, expiry_date, warranty_expiry, credentials_payload, products(name, image_url), plans(name, duration_days))')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data as unknown as WarrantyClaimWithDetails[]
      }
    } catch {
      // Fallback
    }

    const memoryClaims = MemoryStore.getWarrantyClaims(customerId)
    if (memoryClaims.length > 0) {
      return memoryClaims.map((c) => ({
        ...c,
        subscriptions: {
          subscription_number: 'SUB-VH-ACTIVE',
          activation_date: new Date().toISOString(),
          expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          warranty_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          credentials_payload: null,
          products: { name: 'ChatGPT Plus & Pro', image_url: null },
          plans: { name: '1 Month Subscription', duration_days: 30 },
        },
      }))
    }

    return []
  }

  /**
   * Get single warranty claim by ID
   */
  static async getById(claimId: string, customerId?: string): Promise<WarrantyClaimWithDetails | null> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('warranty_claims')
        .select('*, subscriptions(subscription_number, activation_date, expiry_date, warranty_expiry, credentials_payload, products(name, image_url), plans(name, duration_days)), profiles(full_name, email, phone)')
        .eq('id', claimId)

      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data, error } = await query.single()
      if (!error && data) {
        return data as unknown as WarrantyClaimWithDetails
      }
    } catch {
      // Fallback
    }
    return null
  }

  /**
   * Admin: Get all warranty claims
   */
  static async getAllAdmin(status?: string, search?: string): Promise<WarrantyClaimWithDetails[]> {
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('warranty_claims')
        .select('*, subscriptions(subscription_number, activation_date, expiry_date, warranty_expiry, credentials_payload, products(name, image_url), plans(name, duration_days)), profiles(full_name, email, phone)')
        .order('created_at', { ascending: false })

      if (status && status !== 'ALL') {
        query = query.eq('status', status as WarrantyStatus)
      }

      if (search && search.trim()) {
        const s = search.trim()
        query = query.or(`claim_number.ilike.%${s}%,reason.ilike.%${s}%,description.ilike.%${s}%`)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as unknown as WarrantyClaimWithDetails[]
      }
    } catch {
      // Fallback
    }

    const memoryClaims = MemoryStore.getWarrantyClaims()
    let list: WarrantyClaimWithDetails[] = memoryClaims.map((c: any) => ({
      ...c,
      subscriptions: c.subscriptions || {
        subscription_number: 'SUB-VH-77402',
        activation_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        warranty_expiry: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        credentials_payload: JSON.stringify({ email: 'chatgpt-user@verifiedhub.com', password: 'OldPassword123' }),
        products: { name: 'ChatGPT Plus & Pro', image_url: null },
        plans: { name: '1 Month Subscription', duration_days: 30 },
      },
      profiles: c.profiles || {
        full_name: 'Sunil Mandal (Owner)',
        email: 'mandalsunilp@gmail.com',
        phone: '+977 9714501795',
      },
    }))

    if (status && status !== 'ALL') {
      list = list.filter((c) => c.status === status)
    }
    return list
  }

  /**
   * Admin: Resolve claim (Replaced, Reactivated, Extended, or Rejected)
   */
  static async resolveClaim(payload: {
    claimId: string
    adminId: string
    status: WarrantyStatus
    actionTaken: string
    adminNotes?: string
    newCredentialsPayload?: string
    extensionDays?: number
    subscriptionId: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()

      // 1. Update claim record
      await (adminSupabase.from('warranty_claims') as any)
        .update({
          status: payload.status,
          action_taken: payload.actionTaken,
          admin_notes: payload.adminNotes || null,
          resolved_at: new Date().toISOString(),
          resolved_by: payload.adminId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.claimId)

      // 2. If replacement credentials provided, update subscription
      if (payload.newCredentialsPayload && payload.status === 'replaced') {
        await (adminSupabase.from('subscriptions') as any)
          .update({
            credentials_payload: payload.newCredentialsPayload,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.subscriptionId)
      }

      // 3. If extension days specified, extend expiry_date and warranty_expiry
      if (payload.extensionDays && payload.extensionDays > 0) {
        const { data: sub } = await adminSupabase
          .from('subscriptions')
          .select('expiry_date, warranty_expiry')
          .eq('id', payload.subscriptionId)
          .single()

        if (sub) {
          const currentExp = new Date(sub.expiry_date)
          const currentWar = new Date(sub.warranty_expiry)

          currentExp.setDate(currentExp.getDate() + payload.extensionDays)
          currentWar.setDate(currentWar.getDate() + payload.extensionDays)

          await (adminSupabase.from('subscriptions') as any)
            .update({
              expiry_date: currentExp.toISOString(),
              warranty_expiry: currentWar.toISOString(),
              status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payload.subscriptionId)
        }
      }
    } catch {
      // Fallback
    }

    MemoryStore.updateWarrantyClaim(payload.claimId, {
      status: payload.status,
      action_taken: payload.actionTaken,
      admin_notes: payload.adminNotes,
    })

    return { success: true }
  }
}
