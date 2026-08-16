'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { NotificationRepository } from '@/repositories/notificationRepository'

export async function markNotificationAsReadAction(id: string) {
  const authContext = await AuthService.getCurrentUser()
  if (!authContext?.user) return { success: false }

  const ok = await NotificationRepository.markAsRead(id, authContext.user.id)
  revalidatePath('/dashboard/notifications')
  return { success: ok }
}

export async function markAllNotificationsAsReadAction() {
  const authContext = await AuthService.getCurrentUser()
  if (!authContext?.user) return { success: false }

  const ok = await NotificationRepository.markAllAsRead(authContext.user.id)
  revalidatePath('/dashboard/notifications')
  return { success: ok }
}
