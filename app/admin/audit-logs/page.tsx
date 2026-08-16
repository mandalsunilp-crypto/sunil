import { AuthService } from '@/services/authService'
import { AuditLogRepository } from '@/repositories/auditLogRepository'
import { AuditLogsClient } from '@/components/admin/AuditLogsClient'

export const dynamic = 'force-dynamic'

export default async function AdminAuditLogsPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const logs = await AuditLogRepository.getAllAdmin()

  return <AuditLogsClient initialLogs={logs} />
}
