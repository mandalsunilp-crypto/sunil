import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { KYCManagementClient } from '@/components/admin/KYCManagementClient'

export const dynamic = 'force-dynamic'

export default async function AdminKYCPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'support'])

  const kycRequests = MemoryStore.getKYCRequests()

  return <KYCManagementClient kycRequests={kycRequests} />
}
