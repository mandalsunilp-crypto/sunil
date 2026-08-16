import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { LeadsClient } from '@/components/admin/LeadsClient'

export const dynamic = 'force-dynamic'

export default async function AdminLeadsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'support'])

  const leads = MemoryStore.getLeads()

  return <LeadsClient leads={leads} />
}
