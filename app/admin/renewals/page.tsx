import { AuthService } from '@/services/authService'
import { RenewalRepository } from '@/repositories/renewalRepository'
import { RenewalsClient } from '@/components/admin/RenewalsClient'

export const dynamic = 'force-dynamic'

export default async function AdminRenewalsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const renewals = await RenewalRepository.getAllAdmin()

  return <RenewalsClient initialRenewals={renewals} />
}
