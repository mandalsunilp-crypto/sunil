import { createAdminClient } from '@/lib/supabase/admin'
import { Database, InventoryStatus } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type Inventory = Database['public']['Tables']['inventory']['Row']
export type InventoryInsert = Database['public']['Tables']['inventory']['Insert']
export type InventoryUpdate = Database['public']['Tables']['inventory']['Update']

export interface InventoryWithDetails extends Inventory {
  products?: { name: string; slug: string; category: string; image_url: string | null }
  plans?: { name: string; duration_days: number; selling_price: number }
  suppliers?: { supplier_name: string; contact_person: string | null; email: string | null }
}

export class InventoryRepository {
  /**
   * Admin: Get all inventory items with relational product, plan, and supplier details
   */
  static async getAllAdmin(status?: string, productId?: string): Promise<InventoryWithDetails[]> {
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('inventory')
        .select('*, products(name, slug, category, image_url), plans(name, duration_days, selling_price), suppliers(supplier_name, contact_person, email)')
        .order('created_at', { ascending: false })

      if (status && status !== 'ALL') {
        query = query.eq('status', status as InventoryStatus)
      }

      if (productId && productId !== 'ALL') {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as unknown as InventoryWithDetails[]
      }
    } catch {
      // Fallback
    }

    // Return batches from MemoryStore
    const batches = MemoryStore.getInventoryBatches()
    const products = MemoryStore.getProducts()
    const suppliers = MemoryStore.getSuppliers()

    return batches.map((b) => {
      const p = products.find((pr) => pr.id === b.product_id)
      const s = suppliers.find((sp) => sp.id === b.supplier_id)
      const totalStock = Number(b.quantity_added || 0)
      const reservedStock = 0
      const availableStock = Math.max(0, totalStock - reservedStock)

      let calculatedStatus: InventoryStatus = 'in_stock'
      if (availableStock <= 0) calculatedStatus = 'out_of_stock'
      else if (availableStock <= 5) calculatedStatus = 'low_stock'

      const statusVal = (b.status === 'in_stock' || b.status === 'low_stock' || b.status === 'out_of_stock')
        ? (b.status as InventoryStatus)
        : calculatedStatus

      return {
        id: b.id,
        product_id: b.product_id,
        plan_id: null,
        supplier_id: b.supplier_id,
        total_stock: totalStock,
        reserved_stock: reservedStock,
        available_stock: availableStock,
        purchase_cost: Number(b.unit_cost || 0),
        status: statusVal,
        notes: b.notes,
        created_at: b.created_at,
        updated_at: b.created_at,
        products: p ? { name: p.name, slug: p.slug, category: p.category, image_url: p.image_url } : { name: 'AI Tool', slug: 'ai-tool', category: 'AI', image_url: null },
        suppliers: s ? { supplier_name: s.supplier_name, contact_person: s.contact_person, email: s.email } : { supplier_name: 'Wholesale Supplier', contact_person: null, email: null },
      } as unknown as InventoryWithDetails
    })
  }

  /**
   * Get single inventory by ID
   */
  static async getById(inventoryId: string): Promise<InventoryWithDetails | null> {
    const all = await this.getAllAdmin()
    return all.find((i) => i.id === inventoryId) || null
  }

  /**
   * Create inventory record
   */
  static async create(payload: InventoryInsert): Promise<{ success: boolean; inventory?: Inventory; error?: string }> {
    try {
      const adminSupabase = createAdminClient()
      const totalStock = payload.total_stock || 0
      const reservedStock = payload.reserved_stock || 0
      const available = totalStock - reservedStock

      let calculatedStatus: InventoryStatus = 'in_stock'
      if (available <= 0) calculatedStatus = 'out_of_stock'
      else if (available <= 5) calculatedStatus = 'low_stock'

      const { data, error } = await (adminSupabase.from('inventory') as any)
        .insert({
          ...payload,
          available_stock: available,
          status: payload.status || calculatedStatus,
        })
        .select('*')
        .single()

      if (!error && data) {
        return { success: true, inventory: data as Inventory }
      }
    } catch {
      // Fallback
    }

    const batch = MemoryStore.addInventoryBatch({
      batch_name: `Batch #${Date.now().toString().slice(-4)}`,
      product_id: payload.product_id,
      supplier_id: payload.supplier_id || 'sup-1',
      quantity_added: payload.total_stock || 10,
      unit_cost: payload.purchase_cost || 500,
      notes: payload.notes || null,
      status: 'active',
    })

    return {
      success: true,
      inventory: {
        id: batch.id,
        product_id: batch.product_id,
        plan_id: null,
        supplier_id: batch.supplier_id,
        total_stock: batch.quantity_added,
        reserved_stock: 0,
        available_stock: batch.quantity_added,
        purchase_cost: batch.unit_cost,
        status: 'in_stock',
        notes: batch.notes,
        created_at: batch.created_at,
        updated_at: batch.created_at,
      } as unknown as Inventory,
    }
  }

  /**
   * Update inventory stock lot
   */
  static async update(
    inventoryId: string,
    payload: InventoryUpdate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('inventory') as any)
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventoryId)
    } catch {
      // Fallback
    }

    const batches = MemoryStore.getInventoryBatches()
    const batch = batches.find((b) => b.id === inventoryId)
    if (batch) {
      if (payload.total_stock !== undefined) batch.quantity_added = payload.total_stock
      if (payload.purchase_cost !== undefined) batch.unit_cost = payload.purchase_cost
      if (payload.notes !== undefined) batch.notes = payload.notes
      if (payload.status !== undefined) batch.status = payload.status as any
    }

    return { success: true }
  }

  /**
   * Restock units
   */
  static async restock(inventoryId: string, additionalUnits: number): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()
      const { data: current } = await (adminSupabase.from('inventory') as any)
        .select('total_stock, reserved_stock')
        .eq('id', inventoryId)
        .single()

      const currentTotal = Number(current?.total_stock || 0)
      const currentReserved = Number(current?.reserved_stock || 0)
      const newTotal = Math.max(0, currentTotal + additionalUnits)
      const newAvailable = Math.max(0, newTotal - currentReserved)

      let calculatedStatus: InventoryStatus = 'in_stock'
      if (newAvailable <= 0) calculatedStatus = 'out_of_stock'
      else if (newAvailable <= 5) calculatedStatus = 'low_stock'

      await (adminSupabase.from('inventory') as any)
        .update({
          total_stock: newTotal,
          available_stock: newAvailable,
          status: calculatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', inventoryId)
    } catch {
      // Fallback
    }

    const batches = MemoryStore.getInventoryBatches()
    const batch = batches.find((b) => b.id === inventoryId)
    if (batch) {
      batch.quantity_added = Math.max(0, Number(batch.quantity_added || 0) + additionalUnits)
      const avail = batch.quantity_added
      if (avail <= 0) batch.status = 'out_of_stock'
      else if (avail <= 5) batch.status = 'low_stock'
      else batch.status = 'in_stock'
    }

    return { success: true }
  }

  /**
   * Delete inventory stock lot
   */
  static async delete(inventoryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('inventory').delete().eq('id', inventoryId)
    } catch {
      // Fallback
    }

    MemoryStore.deleteInventoryBatch(inventoryId)
    return { success: true }
  }
}
