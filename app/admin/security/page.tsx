import { AuthService } from '@/services/authService'
import { createAdminClient } from '@/lib/supabase/admin'
import { SecurityOverviewClient } from '@/components/admin/SecurityOverviewClient'

export const dynamic = 'force-dynamic'

export default async function AdminSecurityPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const adminSupabase = createAdminClient()
  const { count } = await adminSupabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })

  return <SecurityOverviewClient auditLogsCount={count || 0} />
}
