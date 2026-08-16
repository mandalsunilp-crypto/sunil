import { AuthService } from '@/services/authService'
import { AnalyticsRepository } from '@/repositories/analyticsRepository'
import { AnalyticsClient } from '@/components/admin/AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AdminProfitPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const analytics = await AnalyticsRepository.getFinancialAnalytics()

  return <AnalyticsClient analytics={analytics} />
}
