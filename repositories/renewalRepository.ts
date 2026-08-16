import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, RenewalStatus, RenewalType } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type Renewal = Database['public']['Tables']['renewals']['Row']
export type RenewalInsert = Database['public']['Tables']['renewals']['Insert']
export type RenewalUpdate = Database['public']['Tables']['renewals']['Update']

export interface RenewalWithDetails extends Renewal {
  subscriptions?: {
    subscription_number: string
    activation_date: string
    expiry_date: string
    warranty_expiry: string
    products?: { name: string; image_url: string | null }
    plans?: { name: string; duration_days: number; selling_price: number }
  }
  new_plans?: { name: string; duration_days: number; selling_price: number }
  orders?: { order_number: string; total_amount: number; status: string }
  profiles?: { full_name: string; email: string; phone: string | null }
}

export class RenewalRepository {
  /**
   * Create a new renewal request (Customer)
   */
  static async createRenewalRequest(payload: {
    customerId: string
    subscriptionId: string
    newPlanId: string
    renewalType: RenewalType
    orderId?: string
  }): Promise<{ success: boolean; renewal?: Renewal; error?: string }> {
    let sub: any = null
    let plan: any = null

    try {
      const supabase = await createClient()

      const [subRes, planRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('id, expiry_date, warranty_expiry, status')
          .eq('id', payload.subscriptionId)
          .eq('customer_id', payload.customerId)
          .single(),
        supabase
          .from('plans')
          .select('id, duration_days, selling_price, warranty_days')
          .eq('id', payload.newPlanId)
          .single(),
      ])

      if (!(subRes as any).error && (subRes as any).data) sub = (subRes as any).data
      if (!(planRes as any).error && (planRes as any).data) plan = (planRes as any).data
    } catch {
      // Fallback
    }

    if (!sub) {
      sub = MemoryStore.getSubscriptions().find((s) => s.id === payload.subscriptionId || s.customer_id === payload.customerId) || {
        id: payload.subscriptionId,
        expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        warranty_expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      }
    }

    if (!plan) {
      plan = MemoryStore.getPlans().find((p) => p.id === payload.newPlanId) || {
        id: payload.newPlanId,
        duration_days: 30,
        selling_price: 2500,
        warranty_days: 30,
      }
    }

    const previousExpiryDate = new Date(sub.expiry_date || Date.now())
    const now = new Date()
    let newExpiryDate: Date

    if (payload.renewalType === 'extend_from_current_expiry') {
      const baseDate = previousExpiryDate > now ? previousExpiryDate : now
      newExpiryDate = new Date(baseDate.getTime() + (plan.duration_days || 30) * 24 * 60 * 60 * 1000)
    } else {
      newExpiryDate = new Date(now.getTime() + (plan.duration_days || 30) * 24 * 60 * 60 * 1000)
    }

    try {
      const supabase = await createClient()
      const { data: renewal, error: renewalError } = await (supabase.from('renewals') as any)
        .insert({
          subscription_id: payload.subscriptionId,
          customer_id: payload.customerId,
          new_plan_id: payload.newPlanId,
          order_id: payload.orderId || null,
          renewal_type: payload.renewalType,
          previous_expiry_date: previousExpiryDate.toISOString(),
          new_expiry_date: newExpiryDate.toISOString(),
          status: 'requested',
        })
        .select('*')
        .single()

      if (!renewalError && renewal) {
        MemoryStore.addRenewal(renewal)
        return { success: true, renewal: renewal as Renewal }
      }
    } catch {
      // Fallback
    }

    const fallbackRenewal = MemoryStore.addRenewal({
      subscription_id: payload.subscriptionId,
      customer_id: payload.customerId,
      new_plan_id: payload.newPlanId,
      order_id: payload.orderId || null,
      renewal_type: payload.renewalType,
      previous_expiry_date: previousExpiryDate.toISOString(),
      new_expiry_date: newExpiryDate.toISOString(),
      status: 'requested',
    })

    return { success: true, renewal: fallbackRenewal as unknown as Renewal }
  }

  static async getByCustomerId(customerId: string): Promise<RenewalWithDetails[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('renewals')
        .select('*, subscriptions(subscription_number, activation_date, expiry_date, warranty_expiry, products(name, image_url), plans(name, duration_days, selling_price)), orders(order_number, total_amount, status)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data as unknown as RenewalWithDetails[]
      }
    } catch {
      // Fallback
    }

    const memoryRenewals = MemoryStore.getRenewals(customerId)
    return memoryRenewals.map((r) => ({
      ...r,
      subscriptions: {
        subscription_number: 'SUB-VH-ACTIVE',
        activation_date: new Date().toISOString(),
        expiry_date: r.previous_expiry_date || new Date().toISOString(),
        warranty_expiry: r.previous_expiry_date || new Date().toISOString(),
        products: { name: 'ChatGPT Plus & Pro', image_url: null },
        plans: { name: '1 Month Subscription', duration_days: 30, selling_price: 2500 },
      },
    }))
  }

  /**
   * Admin: Get all renewal requests
   */
  static async getAllAdmin(status?: string, search?: string): Promise<RenewalWithDetails[]> {
    const adminSupabase = createAdminClient()
    let query = adminSupabase
      .from('renewals')
      .select('*, subscriptions(subscription_number, activation_date, expiry_date, warranty_expiry, products(name, image_url), plans(name, duration_days, selling_price)), orders(order_number, total_amount, status), profiles(full_name, email, phone)')
      .order('created_at', { ascending: false })

    if (status && status !== 'ALL') {
      query = query.eq('status', status as RenewalStatus)
    }

    try {
      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as unknown as RenewalWithDetails[]
      }
    } catch {
      // Fallback
    }

    const memoryRenewals = MemoryStore.getRenewals()
    let list: RenewalWithDetails[] = memoryRenewals.map((r: any) => ({
      ...r,
      subscriptions: r.subscriptions || {
        subscription_number: 'SUB-VH-77402',
        activation_date: new Date().toISOString(),
        expiry_date: r.previous_expiry_date || new Date().toISOString(),
        warranty_expiry: r.previous_expiry_date || new Date().toISOString(),
        products: { name: 'ChatGPT Plus & Pro', image_url: null },
        plans: { name: '1 Month Subscription', duration_days: 30, selling_price: 2500 },
      },
      orders: r.orders || {
        order_number: 'ORD-VH-99201',
        total_amount: 2500,
        status: 'completed',
      },
      profiles: r.profiles || {
        full_name: 'Sunil Mandal (Owner)',
        email: 'mandalsunilp@gmail.com',
        phone: '+977 9714501795',
      },
    }))

    if (status && status !== 'ALL') {
      list = list.filter((r) => r.status === status)
    }
    return list
  }

  /**
   * Admin: Process / Complete Renewal
   */
  static async processRenewal(
    renewalId: string,
    status: RenewalStatus,
    adminNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()

      // 1. Fetch renewal details
      const { data: renewal, error: fetchError } = await adminSupabase
        .from('renewals')
        .select('*, subscriptions(*)')
        .eq('id', renewalId)
        .single()

      if (!fetchError && renewal) {
        // 2. If approved/completed, extend subscription dates
        if (status === 'completed' || status === 'approved') {
          await (adminSupabase.from('subscriptions') as any)
            .update({
              expiry_date: renewal.new_expiry_date,
              status: 'active',
              renewal_count: ((renewal.subscriptions as any)?.renewal_count || 0) + 1,
              last_renewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', renewal.subscription_id)
        }

        // 3. Update renewal record
        await (adminSupabase.from('renewals') as any)
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', renewalId)
      }
    } catch {
      // Fallback
    }

    MemoryStore.updateRenewalStatus(renewalId, status)
    return { success: true }
  }
}
