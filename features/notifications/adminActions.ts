'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'

export async function adminCreateNotificationAction(formData: FormData) {
  try {
    await AuthService.requireRole(['super_admin', 'admin'])

    const title = formData.get('title') as string
    const message = formData.get('message') as string
    const badge = (formData.get('badge') as string) || 'PROMO'
    const targetRole = (formData.get('targetRole') as string) || 'all'
    const linkUrl = (formData.get('linkUrl') as string) || '/'

    if (!title || !message) {
      return { success: false, message: 'Title and message are required.' }
    }

    MemoryStore.addNotification({
      title: title.trim(),
      message: message.trim(),
      badge: badge.trim(),
      target_role: targetRole,
      link_url: linkUrl.trim(),
      is_active: true,
    })

    revalidatePath('/admin/notifications')
    revalidatePath('/dashboard')
    revalidatePath('/')

    return { success: true, message: 'Announcement created and published!' }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}

export async function adminToggleNotificationAction(id: string) {
  try {
    await AuthService.requireRole(['super_admin', 'admin'])
    MemoryStore.toggleNotification(id)
    revalidatePath('/admin/notifications')
    return { success: true }
  } catch (err: any) {
    return { success: false, message: err.message }
  }
}
