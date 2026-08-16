import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, CouponStatus, CouponType } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type Coupon = Database['public']['Tables']['coupons']['Row']
export type CouponInsert = Database['public']['Tables']['coupons']['Insert']
export type CouponUpdate = Database['public']['Tables']['coupons']['Update']

export interface CouponValidationResult {
  valid: boolean
  coupon?: Coupon
  discountAmount: number
  finalAmount: number
  message?: string
}

export class CouponRepository {
  /**
   * Admin: Get all coupons
   */
  static async getAllAdmin(status?: string, search?: string): Promise<Coupon[]> {
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'ALL') {
        query = query.eq('status', status as CouponStatus)
      }

      if (search && search.trim()) {
        const s = search.trim()
        query = query.ilike('code', `%${s}%`)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as Coupon[]
      }
    } catch {
      // Fallback
    }

    // Return MemoryStore coupons mapped to Coupon type
    let coupons = MemoryStore.getCoupons().map((c) => ({
      id: c.id,
      code: c.code,
      type: (c.discount_type as CouponType) || 'percentage',
      value: c.discount_value,
      minimum_order_amount: c.min_order_amount,
      maximum_discount: c.max_discount_amount,
      usage_limit: c.max_uses,
      times_used: c.uses_count,
      per_user_limit: 1,
      start_date: c.starts_at || new Date().toISOString(),
      expiry_date: c.expires_at,
      status: c.status as CouponStatus,
      created_at: c.created_at,
      updated_at: c.created_at,
    })) as unknown as Coupon[]

    if (status && status !== 'ALL') {
      coupons = coupons.filter((c) => c.status === status)
    }
    if (search && search.trim()) {
      const s = search.trim().toUpperCase()
      coupons = coupons.filter((c) => c.code.includes(s))
    }
    return coupons
  }

  /**
   * Get coupon by ID
   */
  static async getById(couponId: string): Promise<Coupon | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single()

      if (!error && data) {
        return data as Coupon
      }
    } catch {
      // Fallback
    }

    const all = await this.getAllAdmin()
    return all.find((c) => c.id === couponId) || null
  }

  /**
   * Get coupon by code
   */
  static async getByCode(code: string): Promise<Coupon | null> {
    const cleanCode = code.toUpperCase().trim()
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', cleanCode)
        .single()

      if (!error && data) {
        return data as Coupon
      }
    } catch {
      // Fallback
    }

    const all = await this.getAllAdmin()
    return all.find((c) => c.code === cleanCode) || null
  }

  /**
   * Create new coupon (Admin)
   */
  static async create(payload: CouponInsert): Promise<{ success: boolean; coupon?: Coupon; error?: string }> {
    const cleanCode = payload.code.toUpperCase().trim()
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('coupons')
        .insert({
          ...payload,
          code: cleanCode,
        })
        .select('*')
        .single()

      if (!error && data) {
        return { success: true, coupon: data as Coupon }
      }
    } catch {
      // Fallback
    }

    const created = MemoryStore.addCoupon({
      code: cleanCode,
      discount_type: (payload.type as any) || 'percentage',
      discount_value: payload.value,
      min_order_amount: payload.minimum_order_amount || 0,
      max_discount_amount: payload.maximum_discount || null,
      max_uses: payload.usage_limit || null,
      status: payload.status || 'active',
      starts_at: payload.start_date || null,
      expires_at: payload.expiry_date || null,
    })

    return {
      success: true,
      coupon: {
        ...payload,
        id: created.id,
        code: cleanCode,
        times_used: 0,
        per_user_limit: 1,
        created_at: created.created_at,
        updated_at: created.created_at,
      } as unknown as Coupon,
    }
  }

  /**
   * Update coupon (Admin)
   */
  static async update(
    couponId: string,
    payload: CouponUpdate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('coupons') as any)
        .update({
          ...payload,
          code: payload.code ? payload.code.toUpperCase().trim() : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', couponId)
    } catch {
      // Fallback
    }

    MemoryStore.updateCoupon(couponId, {
      code: payload.code ? payload.code.toUpperCase().trim() : undefined,
      discount_type: payload.type as any,
      discount_value: payload.value,
      min_order_amount: payload.minimum_order_amount,
      status: payload.status,
    })

    return { success: true }
  }

  /**
   * Delete coupon
   */
  static async delete(couponId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('coupons').delete().eq('id', couponId)
    } catch {
      // Fallback
    }

    MemoryStore.deleteCoupon(couponId)
    return { success: true }
  }

  /**
   * Validate coupon code for checkout
   */
  static async validateCoupon(
    code: string,
    subtotal: number,
    customerId?: string
  ): Promise<CouponValidationResult> {
    const cleanCode = code.toUpperCase().trim()
    const coupon = await this.getByCode(cleanCode)

    if (!coupon) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: subtotal,
        message: 'Invalid coupon code.',
      }
    }

    if (coupon.status !== 'active') {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: subtotal,
        message: 'This coupon is no longer active.',
      }
    }

    if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
      return {
        valid: false,
        discountAmount: 0,
        finalAmount: subtotal,
        message: `Minimum order amount of Rs. ${coupon.minimum_order_amount} required for this coupon.`,
      }
    }

    let discountAmount = 0
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((subtotal * coupon.value) / 100)
      if (coupon.maximum_discount && discountAmount > coupon.maximum_discount) {
        discountAmount = coupon.maximum_discount
      }
    } else {
      discountAmount = Math.min(coupon.value, subtotal)
    }

    const finalAmount = Math.max(0, subtotal - discountAmount)

    return {
      valid: true,
      coupon,
      discountAmount,
      finalAmount,
      message: `Coupon ${cleanCode} applied! Saved Rs. ${discountAmount}`,
    }
  }
}
