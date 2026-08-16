'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { ProductRepository } from '@/repositories/productRepository'
import { PlanRepository } from '@/repositories/planRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { productSchema } from './schemas'
import { ProductStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Helper to generate slug from name
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Create a new product (Admin Only)
 */
export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const name = formData.get('name') as string
    const slugInput = (formData.get('slug') as string) || slugify(name || '')
    const featuresRaw = formData.get('features') as string
    let features: string[] = []

    if (featuresRaw) {
      features = featuresRaw
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
    }

    const rawData = {
      name,
      slug: slugInput,
      description: formData.get('description') || undefined,
      category: formData.get('category') || 'AI Assistants',
      imageUrl: formData.get('imageUrl') || undefined,
      features,
      displayOrder: formData.get('displayOrder') || 0,
      status: formData.get('status') || 'active',
    }

    const parsed = productSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const created = await ProductRepository.create({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      category: parsed.data.category,
      image_url: parsed.data.imageUrl || null,
      features: parsed.data.features,
      display_order: parsed.data.displayOrder,
      status: parsed.data.status,
    })

    if (!created) {
      return {
        success: false,
        message: 'Failed to create product. Slug may already be in use.',
      }
    }

    // Auto-create default plan so it shows immediately with pricing on frontend
    try {
      await PlanRepository.create({
        product_id: created.id,
        name: '1 Month Subscription',
        duration_days: 30,
        selling_price: 2500,
        investment_cost: 1800,
        warranty_days: 30,
        stock: 25,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    } catch {
      // Suppress
    }

    // Log audit log safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'product_created',
        entity_type: 'products',
        entity_id: created.id,
        new_data: created as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/products')
    revalidatePath('/')
    revalidatePath('/products')

    return {
      success: true,
      message: 'Product created successfully and published to storefront.',
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
 * Update an existing product (Admin Only)
 */
export async function updateProductAction(productId: string, formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const featuresRaw = formData.get('features') as string
    let features: string[] = []

    if (featuresRaw) {
      features = featuresRaw
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
    }

    const rawData = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || undefined,
      category: formData.get('category') || 'AI Assistants',
      imageUrl: formData.get('imageUrl') || formData.get('image_url') || undefined,
      features,
      displayOrder: formData.get('displayOrder') || 0,
      status: formData.get('status') || 'active',
    }

    const parsed = productSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Validation failed.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const updated = await ProductRepository.update(productId, {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      category: parsed.data.category,
      image_url: parsed.data.imageUrl || null,
      features: parsed.data.features,
      display_order: parsed.data.displayOrder,
      status: parsed.data.status,
    })

    if (!updated) {
      return {
        success: false,
        message: 'Failed to update product.',
      }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'product_updated',
        entity_type: 'products',
        entity_id: productId,
        new_data: updated as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/products')
    revalidatePath('/')
    revalidatePath(`/products/${parsed.data.slug}`)

    return {
      success: true,
      message: 'Product updated successfully.',
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
 * Toggle product status (active / inactive / archived)
 */
export async function toggleProductStatusAction(productId: string, newStatus: ProductStatus): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const ok = await ProductRepository.updateStatus(productId, newStatus)
    if (!ok) {
      return { success: false, message: 'Failed to update status.' }
    }

    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'product_status_changed',
        entity_type: 'products',
        entity_id: productId,
        new_data: { status: newStatus },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/products')
    revalidatePath('/')

    return { success: true, message: `Product marked as ${newStatus}.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized.' }
  }
}
