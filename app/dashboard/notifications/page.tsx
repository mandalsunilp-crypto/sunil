import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { NotificationRepository } from '@/repositories/notificationRepository'
import { NotificationCenterClient } from '@/components/notifications/NotificationCenterClient'

export const dynamic = 'force-dynamic'

export default async function CustomerNotificationsPage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const notifications = await NotificationRepository.getByUserId(user.id)

  return <NotificationCenterClient initialNotifications={notifications} />
}
