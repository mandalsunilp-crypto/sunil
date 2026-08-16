'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { PlanRepository } from '@/repositories/planRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { planSchema } from './schemas'
import { PlanStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Create a new plan (Admin Only)
 */
export async function createPlanAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const rawData = {
      productId: formData.get('productId'),
      name: formData.get('name'),
      durationDays: formData.get('durationDays'),
      sellingPrice: formData.get('sellingPrice'),
      investmentCost: formData.get('investmentCost') || 0,
      warrantyDays: formData.get('warrantyDays') || 0,
      stock: formData.get('stock') || -1,
      status: formData.get('status') || 'active',
    }

    const parsed = planSchema.safeParse(rawData)
    if (!parsed.success) {
      const fieldErrStr = Object.entries(parsed.error.flatten().fieldErrors)
        .map(([k, v]) => `${k}: ${v?.join(', ')}`)
        .join('; ')
      return {
        success: false,
        message: fieldErrStr ? `Validation failed: ${fieldErrStr}` : 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const created = await PlanRepository.create({
      product_id: parsed.data.productId,
      name: parsed.data.name,
      duration_days: parsed.data.durationDays,
      selling_price: parsed.data.sellingPrice,
      investment_cost: parsed.data.investmentCost,
      warranty_days: parsed.data.warrantyDays,
      stock: parsed.data.stock,
      status: parsed.data.status,
    })

    if (!created) {
      return {
        success: false,
        message: 'Failed to create plan.',
      }
    }

    // Log audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plan_created',
      entity_type: 'plans',
      entity_id: created.id,
      new_data: created as any,
    })

    revalidatePath('/admin/plans')
    revalidatePath('/admin/products')
    revalidatePath('/')

    return {
      success: true,
      message: 'Plan created successfully.',
      data: created,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Update an existing plan (Admin Only)
 */
export async function updatePlanAction(planId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const rawData = {
      productId: formData.get('productId'),
      name: formData.get('name'),
      durationDays: formData.get('durationDays'),
      sellingPrice: formData.get('sellingPrice'),
      investmentCost: formData.get('investmentCost') || 0,
      warrantyDays: formData.get('warrantyDays') || 0,
      stock: formData.get('stock') || -1,
      status: formData.get('status') || 'active',
    }

    const parsed = planSchema.safeParse(rawData)
    if (!parsed.success) {
      const fieldErrStr = Object.entries(parsed.error.flatten().fieldErrors)
        .map(([k, v]) => `${k}: ${v?.join(', ')}`)
        .join('; ')
      return {
        success: false,
        message: fieldErrStr ? `Validation failed: ${fieldErrStr}` : 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const updated = await PlanRepository.update(planId, {
      product_id: parsed.data.productId,
      name: parsed.data.name,
      duration_days: parsed.data.durationDays,
      selling_price: parsed.data.sellingPrice,
      investment_cost: parsed.data.investmentCost,
      warranty_days: parsed.data.warrantyDays,
      stock: parsed.data.stock,
      status: parsed.data.status,
    })

    if (!updated) {
      return {
        success: false,
        message: 'Failed to update plan.',
      }
    }

    // Log audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plan_updated',
      entity_type: 'plans',
      entity_id: planId,
      new_data: updated as any,
    })

    revalidatePath('/admin/plans')
    revalidatePath('/admin/products')
    revalidatePath('/')

    return {
      success: true,
      message: 'Plan updated successfully.',
      data: updated,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Unauthorized or server error.',
    }
  }
}

/**
 * Toggle plan status (active / inactive / archived)
 */
export async function togglePlanStatusAction(planId: string, newStatus: PlanStatus): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const ok = await PlanRepository.updateStatus(planId, newStatus)
    if (!ok) {
      return { success: false, message: 'Failed to update plan status.' }
    }

    // Log audit log
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'plan_status_changed',
      entity_type: 'plans',
      entity_id: planId,
      new_data: { status: newStatus },
    })

    revalidatePath('/admin/plans')
    revalidatePath('/admin/products')
    revalidatePath('/')

    return { success: true, message: `Plan marked as ${newStatus}.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized.' }
  }
}
