import { AuthService } from '@/services/authService'
import { LedgerRepository } from '@/repositories/ledgerRepository'
import { LedgerClient } from '@/components/admin/LedgerClient'

export const dynamic = 'force-dynamic'

export default async function AdminLedgerPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const [entries, summary] = await Promise.all([
    LedgerRepository.getAllAdmin(),
    LedgerRepository.getSummary(),
  ])

  return <LedgerClient initialEntries={entries} summary={summary} />
}
