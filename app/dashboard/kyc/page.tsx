import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { CustomerKYCClient } from '@/components/kyc/CustomerKYCClient'

export const dynamic = 'force-dynamic'

export default async function CustomerKYCPage() {
  const { user } = await AuthService.requireRole(['customer', 'admin', 'super_admin', 'finance', 'support'])

  const kyc = MemoryStore.getKYCByCustomerId(user.id)

  return <CustomerKYCClient kyc={kyc} />
}
