'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { SupplierRepository } from '@/repositories/supplierRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { supplierFormSchema } from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Admin: Create Supplier
 */
export async function adminCreateSupplierAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const rawData = {
      supplier_name: formData.get('supplier_name'),
      contact_person: formData.get('contact_person') || undefined,
      email: formData.get('email') || undefined,
      phone: formData.get('phone') || undefined,
      address: formData.get('address') || undefined,
      notes: formData.get('notes') || undefined,
      status: formData.get('status') || 'active',
    }

    const parsed = supplierFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please check supplier fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await SupplierRepository.create({
      supplier_name: parsed.data.supplier_name,
      contact_person: parsed.data.contact_person || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })

    if (!result.success || !result.supplier) {
      return { success: false, message: result.error || 'Failed to create supplier.' }
    }

    // Audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'supplier_created',
        entity_type: 'suppliers',
        entity_id: result.supplier.id,
        new_data: result.supplier as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/suppliers')

    return {
      success: true,
      message: `Supplier ${result.supplier.supplier_name} created successfully.`,
      data: result.supplier,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Update Supplier
 */
export async function adminUpdateSupplierAction(
  supplierId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const rawData = {
      supplier_name: formData.get('supplier_name'),
      contact_person: formData.get('contact_person') || undefined,
      email: formData.get('email') || undefined,
      phone: formData.get('phone') || undefined,
      address: formData.get('address') || undefined,
      notes: formData.get('notes') || undefined,
      status: formData.get('status') || 'active',
    }

    const parsed = supplierFormSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please check supplier fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await SupplierRepository.update(supplierId, {
      supplier_name: parsed.data.supplier_name,
      contact_person: parsed.data.contact_person || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })

    if (!result.success) {
      return { success: false, message: result.error || 'Failed to update supplier.' }
    }

    // Audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'supplier_updated',
        entity_type: 'suppliers',
        entity_id: supplierId,
        new_data: rawData as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/suppliers')

    return {
      success: true,
      message: 'Supplier updated successfully.',
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}

/**
 * Admin: Delete Supplier
 */
export async function adminDeleteSupplierAction(supplierId: string): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const ok = await SupplierRepository.delete(supplierId)
    if (!ok) {
      return { success: false, message: 'Failed to delete supplier.' }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'supplier_deleted',
        entity_type: 'suppliers',
        entity_id: supplierId,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/suppliers')

    return { success: true, message: 'Supplier deleted successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
