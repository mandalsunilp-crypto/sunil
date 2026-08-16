import { AuthService } from '@/services/authService'
import { AnalyticsRepository } from '@/repositories/analyticsRepository'
import { LedgerRepository } from '@/repositories/ledgerRepository'
import { FinanceOverviewClient } from '@/components/admin/FinanceOverviewClient'

export const dynamic = 'force-dynamic'

export default async function AdminFinancePage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const [analytics, ledgerSummary] = await Promise.all([
    AnalyticsRepository.getFinancialAnalytics(),
    LedgerRepository.getSummary(),
  ])

  const accountBalances: Record<string, number> = {}
  if (ledgerSummary?.accountBalances) {
    for (const [key, val] of Object.entries(ledgerSummary.accountBalances)) {
      accountBalances[key] = val.net
    }
  }

  return <FinanceOverviewClient analytics={analytics} accountBalances={accountBalances} />
}
