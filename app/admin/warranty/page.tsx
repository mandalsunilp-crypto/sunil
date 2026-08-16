import { AuthService } from '@/services/authService'
import { WarrantyRepository } from '@/repositories/warrantyRepository'
import { WarrantyClient } from '@/components/admin/WarrantyClient'

export const dynamic = 'force-dynamic'

export default async function AdminWarrantyPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'support'])

  const claims = await WarrantyRepository.getAllAdmin()

  return <WarrantyClient initialClaims={claims} />
}
