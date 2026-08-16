import { AuthService } from '@/services/authService'
import { AnalyticsRepository } from '@/repositories/analyticsRepository'
import { FinancialReportsClient } from '@/components/admin/FinancialReportsClient'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const analytics = await AnalyticsRepository.getFinancialAnalytics()

  return <FinancialReportsClient analytics={analytics} orders={[]} expenses={[]} />
}
