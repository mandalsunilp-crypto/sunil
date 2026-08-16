import { AuthService } from '@/services/authService'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { WalletsManagementClient } from '@/components/admin/WalletsManagementClient'

export const dynamic = 'force-dynamic'

export default async function AdminWalletsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const wallets = MemoryStore.getWallets()
  const transactions = MemoryStore.getWalletTransactions()

  return <WalletsManagementClient wallets={wallets} transactions={transactions} />
}
