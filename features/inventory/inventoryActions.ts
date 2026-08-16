'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { InventoryRepository } from '@/repositories/inventoryRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { inventoryBatchSchema } from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Admin: Create inventory stock batch
 */
export async function adminCreateInventoryAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const rawData = {
      product_id: formData.get('product_id'),
      plan_id: formData.get('plan_id') || null,
      supplier_id: formData.get('supplier_id') || null,
      total_stock: formData.get('total_stock'),
      purchase_cost: formData.get('purchase_cost') || 0,
      notes: formData.get('notes') || undefined,
    }

    const parsed = inventoryBatchSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please review stock batch fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await InventoryRepository.create({
      product_id: parsed.data.product_id,
      plan_id: parsed.data.plan_id || null,
      supplier_id: parsed.data.supplier_id || null,
      total_stock: parsed.data.total_stock,
      reserved_stock: 0,
      purchase_cost: parsed.data.purchase_cost,
      notes: parsed.data.notes || null,
    })

    if (!result.success || !result.inventory) {
      return { success: false, message: result.error || 'Failed to create inventory batch.' }
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'inventory_batch_created',
        entity_type: 'inventory',
        entity_id: result.inventory.id,
        new_data: result.inventory as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/inventory')

    return {
      success: true,
      message: 'Inventory batch recorded successfully.',
      data: result.inventory,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Restock Units
 */
export async function adminRestockInventoryAction(
  inventoryId: string,
  additionalUnits: number
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    if (additionalUnits === 0) {
      return { success: false, message: 'Please specify a non-zero unit quantity to adjust.' }
    }

    const result = await InventoryRepository.restock(inventoryId, additionalUnits)
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to adjust inventory.' }
    }

    // Audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'inventory_restocked',
        entity_type: 'inventory',
        entity_id: inventoryId,
        new_data: { additional_units: additionalUnits },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/inventory')

    return {
      success: true,
      message:
        additionalUnits > 0
          ? `Successfully added ${additionalUnits} units.`
          : `Successfully reduced ${Math.abs(additionalUnits)} units.`,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Update inventory stock lot
 */
export async function adminUpdateInventoryAction(
  inventoryId: string,
  payload: { total_stock?: number; reserved_stock?: number; purchase_cost?: number; notes?: string; status?: any }
): Promise<ActionResult> {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const result = await InventoryRepository.update(inventoryId, payload)
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to update inventory lot.' }
    }

    revalidatePath('/admin/inventory')
    return { success: true, message: 'Stock lot updated successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Delete inventory stock lot
 */
export async function adminDeleteInventoryAction(inventoryId: string): Promise<ActionResult> {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const result = await InventoryRepository.delete(inventoryId)
    if (!result.success) {
      return { success: false, message: result.error || 'Failed to delete inventory lot.' }
    }

    revalidatePath('/admin/inventory')
    return { success: true, message: 'Stock lot deleted successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Reset inventory to default clean batches
 */
export async function adminResetInventoryAction(): Promise<ActionResult> {
  try {
    await AuthService.requireRole(['super_admin', 'admin', 'finance'])
    const MemoryStore = (await import('@/lib/storage/memoryStore')).MemoryStore
    MemoryStore.resetInventoryBatches()
    revalidatePath('/admin/inventory')
    return { success: true, message: 'Inventory reset to clean default batches.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
