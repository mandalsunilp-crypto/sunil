import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { CustomerWalletClient } from '@/components/wallet/CustomerWalletClient'

export const dynamic = 'force-dynamic'

export default async function CustomerWalletPage() {
  const { user } = await AuthService.requireRole(['customer', 'admin', 'super_admin', 'finance', 'support'])

  const wallet = MemoryStore.getWalletByCustomerId(user.id)
  const transactions = MemoryStore.getWalletTransactions(user.id)

  return <CustomerWalletClient wallet={wallet} transactions={transactions} />
}
