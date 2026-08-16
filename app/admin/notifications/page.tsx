import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { OfferNotificationsClient } from '@/components/admin/OfferNotificationsClient'

export const dynamic = 'force-dynamic'

export default async function AdminNotificationsPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const notifications = MemoryStore.getNotifications()

  return <OfferNotificationsClient notifications={notifications} />
}
