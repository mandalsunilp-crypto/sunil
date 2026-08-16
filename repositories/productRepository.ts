import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, ProductStatus } from '@/types/database.types'
import { MemoryStore, FallbackProduct } from '@/lib/storage/memoryStore'

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export class ProductRepository {
  /**
   * Get all products with optional status filter
   */
  static async getAll(includeInactive: boolean = false): Promise<Product[]> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (!includeInactive) {
        query = query.eq('status', 'active')
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as Product[]
      }
    } catch {
      // Fallback
    }

    // Return MemoryStore fallback products
    let fallback = MemoryStore.getProducts() as unknown as Product[]
    if (!includeInactive) {
      fallback = fallback.filter((p) => p.status === 'active')
    }
    return fallback
  }

  /**
   * Get product by ID
   */
  static async getById(id: string): Promise<Product | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        return data as Product
      }
    } catch {
      // Fallback
    }

    const p = MemoryStore.getProducts().find((prod) => prod.id === id)
    return (p as unknown as Product) || null
  }

  /**
   * Get product by Slug
   */
  static async getBySlug(slug: string): Promise<Product | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!error && data) {
        return data as Product
      }
    } catch {
      // Fallback
    }

    const p = MemoryStore.getProducts().find((prod) => prod.slug === slug)
    return (p as unknown as Product) || null
  }

  /**
   * Create new product (Admin Only)
   */
  static async create(payload: ProductInsert): Promise<Product | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await (adminSupabase.from('products') as any)
        .insert(payload)
        .select('*')
        .single()

      if (!error && data) {
        return data as Product
      }
    } catch {
      // Fallback
    }

    const created = MemoryStore.addProduct({
      name: payload.name,
      slug: payload.slug,
      description: payload.description || null,
      category: payload.category || 'AI Assistants',
      image_url: payload.image_url || null,
      features: Array.isArray(payload.features) ? (payload.features as string[]) : [],
      display_order: payload.display_order || 0,
      status: payload.status || 'active',
    })

    return created as unknown as Product
  }

  /**
   * Update existing product (Admin Only)
   */
  static async update(id: string, payload: ProductUpdate): Promise<Product | null> {
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await (adminSupabase.from('products') as any)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single()

      if (!error && data) {
        return data as Product
      }
    } catch {
      // Fallback
    }

    MemoryStore.updateProduct(id, {
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.slug ? { slug: payload.slug } : {}),
      ...(payload.category ? { category: payload.category } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.image_url !== undefined ? { image_url: payload.image_url } : {}),
      ...(payload.status ? { status: payload.status } : {}),
    })

    return this.getById(id)
  }

  /**
   * Update status (e.g. active, inactive, archived)
   */
  static async updateStatus(id: string, status: ProductStatus): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('products') as any)
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
    } catch {
      // Suppress
    }

    MemoryStore.updateProduct(id, { status })
    return true
  }
}
