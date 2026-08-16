import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, PlanStatus } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

export type CustomerPlan = Omit<Plan, 'investment_cost'>

export class PlanRepository {
  /**
   * Get public active plans for a product (Hides investment_cost)
   */
  static async getPublicByProductId(productId: string): Promise<CustomerPlan[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('plans')
        .select('id, product_id, name, duration_days, selling_price, warranty_days, stock, status, created_at, updated_at')
        .eq('product_id', productId)
        .eq('status', 'active')
        .order('duration_days', { ascending: true })

      if (!error && data && data.length > 0) {
        return data as CustomerPlan[]
      }
    } catch {
      // Fallback
    }

    // Return MemoryStore plans
    let plans = MemoryStore.getPlans(productId)
    if (plans.length === 0) {
      // Create a default plan for newly added products
      const defaultPlan = MemoryStore.addPlan({
        product_id: productId,
        name: '1 Month Standard Plan',
        slug: '1-month-standard',
        duration_days: 30,
        selling_price: 2500,
        investment_cost: 1800,
        warranty_days: 30,
        delivery_type: 'credentials',
        stock_quantity: 20,
        status: 'active',
        display_order: 1,
      })
      plans = [defaultPlan]
    }

    return plans.map((p) => ({
      id: p.id,
      product_id: p.product_id,
      name: p.name,
      duration_days: p.duration_days,
      selling_price: p.selling_price,
      warranty_days: p.warranty_days,
      stock: p.stock_quantity,
      status: p.status as PlanStatus,
      created_at: p.created_at,
      updated_at: p.updated_at,
    })) as CustomerPlan[]
  }

  /**
   * Get all plans for admin (Includes investment_cost)
   */
  static async getAllAdmin(productId?: string): Promise<(Plan & { products?: { name: string } })[]> {
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('plans')
        .select('*, products(name)')
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as unknown as (Plan & { products?: { name: string } })[]
      }
    } catch {
      // Fallback
    }

    const plans = MemoryStore.getPlans(productId)
    const products = MemoryStore.getProducts()

    return plans.map((p) => {
      const prod = products.find((pr) => pr.id === p.product_id)
      return {
        id: p.id,
        product_id: p.product_id,
        name: p.name,
        duration_days: p.duration_days,
        selling_price: p.selling_price,
        investment_cost: p.investment_cost,
        warranty_days: p.warranty_days,
        stock: p.stock_quantity,
        status: p.status as PlanStatus,
        created_at: p.created_at,
        updated_at: p.updated_at,
        products: prod ? { name: prod.name } : { name: 'AI Tool' },
      } as unknown as Plan & { products?: { name: string } }
    })
  }

  /**
   * Get plan by ID
   */
  static async getById(id: string): Promise<Plan | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        return data as Plan
      }
    } catch {
      // Fallback
    }

    const p = MemoryStore.getPlans().find((pl) => pl.id === id)
    if (p) {
      return {
        id: p.id,
        product_id: p.product_id,
        name: p.name,
        duration_days: p.duration_days,
        selling_price: p.selling_price,
        investment_cost: p.investment_cost,
        warranty_days: p.warranty_days,
        stock: p.stock_quantity,
        status: p.status as PlanStatus,
        created_at: p.created_at,
        updated_at: p.updated_at,
      } as unknown as Plan
    }

    return null
  }

  /**
   * Create plan (Admin Only)
   */
  static async create(payload: PlanInsert): Promise<Plan | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await (adminSupabase.from('plans') as any)
        .insert(payload)
        .select('*')
        .single()

      if (!error && data) {
        return data as Plan
      }
    } catch {
      // Fallback
    }

    const created = MemoryStore.addPlan({
      product_id: payload.product_id,
      name: payload.name,
      slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
      duration_days: payload.duration_days,
      selling_price: payload.selling_price,
      investment_cost: payload.investment_cost || 0,
      warranty_days: payload.warranty_days || payload.duration_days,
      delivery_type: 'credentials',
      stock_quantity: payload.stock || 20,
      status: payload.status || 'active',
      display_order: 1,
    })

    return {
      id: created.id,
      product_id: created.product_id,
      name: created.name,
      duration_days: created.duration_days,
      selling_price: created.selling_price,
      investment_cost: created.investment_cost,
      warranty_days: created.warranty_days,
      stock: created.stock_quantity,
      status: created.status as PlanStatus,
      created_at: created.created_at,
      updated_at: created.updated_at,
    } as unknown as Plan
  }

  /**
   * Update plan (Admin Only)
   */
  static async update(id: string, payload: PlanUpdate): Promise<Plan | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await (adminSupabase.from('plans') as any)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (!error && data) {
        return data as Plan
      }
    } catch {
      // Fallback
    }

    MemoryStore.updatePlan(id, {
      product_id: payload.product_id,
      name: payload.name,
      duration_days: payload.duration_days,
      selling_price: payload.selling_price,
      investment_cost: payload.investment_cost,
      warranty_days: payload.warranty_days,
      stock_quantity: payload.stock,
      status: payload.status,
    })

    return this.getById(id)
  }

  /**
   * Update plan status
   */
  static async updateStatus(id: string, status: PlanStatus): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('plans') as any)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    } catch {
      // Suppress
    }

    MemoryStore.updatePlan(id, { status })
    return true
  }
}
