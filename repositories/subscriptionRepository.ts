import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, SubscriptionStatus } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

export interface SubscriptionWithDetails extends Subscription {
  products?: { name: string; slug: string; category: string; image_url: string | null }
  plans?: { name: string; duration_days: number; selling_price: number; warranty_days: number }
  profiles?: { full_name: string; email: string; phone: string | null }
}

export class SubscriptionRepository {
  /**
   * Get subscriptions for a specific customer
   */
  static async getByCustomerId(customerId: string): Promise<SubscriptionWithDetails[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, products(name, slug, category, image_url), plans(name, duration_days, selling_price, warranty_days)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data as unknown as SubscriptionWithDetails[]
      }
    } catch {
      // Fallback
    }

    const subs = MemoryStore.getSubscriptions(customerId)
    const products = MemoryStore.getProducts()
    const plans = MemoryStore.getPlans()

    return subs.map((s) => {
      const prod = products.find((p) => p.id === s.product_id)
      const pl = plans.find((p) => p.id === s.plan_id)
      return {
        ...s,
        products: {
          name: prod?.name || 'ChatGPT Plus & Pro',
          slug: prod?.slug || 'chatgpt-plus',
          category: prod?.category || 'AI Assistants',
          image_url: prod?.image_url || null,
        },
        plans: {
          name: pl?.name || '1 Month Subscription',
          duration_days: pl?.duration_days || 30,
          selling_price: pl?.selling_price || 2500,
          warranty_days: pl?.warranty_days || 30,
        },
      } as unknown as SubscriptionWithDetails
    })
  }

  /**
   * Get single subscription by ID
   */
  static async getById(subscriptionId: string, customerId?: string): Promise<SubscriptionWithDetails | null> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('subscriptions')
        .select('*, products(name, slug, category, image_url), plans(name, duration_days, selling_price, warranty_days), profiles(full_name, email, phone)')
        .eq('id', subscriptionId)

      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data, error } = await query.single()
      if (!error && data) {
        return data as unknown as SubscriptionWithDetails
      }
    } catch {
      // Fallback
    }

    const sub = MemoryStore.getSubscriptions().find((s) => s.id === subscriptionId)
    if (sub) {
      const prod = MemoryStore.getProducts().find((p) => p.id === sub.product_id)
      const pl = MemoryStore.getPlans().find((p) => p.id === sub.plan_id)
      return {
        ...sub,
        products: {
          name: prod?.name || 'ChatGPT Plus & Pro',
          slug: prod?.slug || 'chatgpt-plus',
          category: prod?.category || 'AI Assistants',
          image_url: prod?.image_url || null,
        },
        plans: {
          name: pl?.name || '1 Month Subscription',
          duration_days: pl?.duration_days || 30,
          selling_price: pl?.selling_price || 2500,
          warranty_days: pl?.warranty_days || 30,
        },
        profiles: {
          full_name: 'Customer',
          email: 'user@verifiedhub.com',
          phone: '+977 9714501795',
        },
      } as unknown as SubscriptionWithDetails
    }

    return null
  }

  /**
   * Admin: Get all subscriptions with optional filters
   */
  static async getAllAdmin(status?: string, search?: string): Promise<SubscriptionWithDetails[]> {
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('subscriptions')
        .select('*, products(name, slug, category, image_url), plans(name, duration_days, selling_price, warranty_days), profiles(full_name, email, phone)')
        .order('created_at', { ascending: false })

      if (status && status !== 'ALL') {
        query = query.eq('status', status as SubscriptionStatus)
      }

      if (search && search.trim()) {
        const s = search.trim()
        query = query.or(`subscription_number.ilike.%${s}%`)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as unknown as SubscriptionWithDetails[]
      }
    } catch {
      // Fallback
    }

    let subs = MemoryStore.getSubscriptions()
    if (status && status !== 'ALL') {
      subs = subs.filter((s) => s.status === status)
    }

    const products = MemoryStore.getProducts()
    const plans = MemoryStore.getPlans()

    return subs.map((s) => {
      const prod = products.find((p) => p.id === s.product_id)
      const pl = plans.find((p) => p.id === s.plan_id)
      return {
        ...s,
        products: {
          name: prod?.name || 'ChatGPT Plus & Pro',
          slug: prod?.slug || 'chatgpt-plus',
          category: prod?.category || 'AI Assistants',
          image_url: prod?.image_url || null,
        },
        plans: {
          name: pl?.name || '1 Month Subscription',
          duration_days: pl?.duration_days || 30,
          selling_price: pl?.selling_price || 2500,
          warranty_days: pl?.warranty_days || 30,
        },
        profiles: {
          full_name: 'Customer',
          email: 'user@verifiedhub.com',
          phone: '+977 9714501795',
        },
      } as unknown as SubscriptionWithDetails
    })
  }

  /**
   * Admin: Update credentials payload
   */
  static async updateCredentials(
    subscriptionId: string,
    credentialsPayload: string
  ): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('subscriptions') as any)
        .update({
          credentials_payload: credentialsPayload,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${subscriptionId},subscription_number.eq.${subscriptionId}`)
    } catch {
      // Suppress
    }

    const sub = MemoryStore.getSubscriptions().find((s) => s.id === subscriptionId || s.subscription_number === subscriptionId)
    if (sub) {
      sub.credentials_payload = credentialsPayload
      sub.updated_at = new Date().toISOString()
    }

    return true
  }

  /**
   * Admin: Update subscription status
   */
  static async updateStatus(
    subscriptionId: string,
    status: SubscriptionStatus
  ): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('subscriptions') as any)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${subscriptionId},subscription_number.eq.${subscriptionId}`)
    } catch {
      // Suppress
    }

    MemoryStore.updateSubscriptionStatus(subscriptionId, status as any)
    return true
  }

  /**
   * Admin: Adjust subscription expiry & warranty dates
   */
  static async adjustDates(
    subscriptionId: string,
    expiryDate: string,
    warrantyExpiry: string
  ): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('subscriptions') as any)
        .update({
          expiry_date: expiryDate,
          warranty_expiry: warrantyExpiry,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${subscriptionId},subscription_number.eq.${subscriptionId}`)
    } catch {
      // Suppress
    }

    const sub = MemoryStore.getSubscriptions().find((s) => s.id === subscriptionId || s.subscription_number === subscriptionId)
    if (sub) {
      sub.expiry_date = expiryDate
      sub.warranty_expiry = warrantyExpiry
      sub.updated_at = new Date().toISOString()
    }

    return true
  }
}


