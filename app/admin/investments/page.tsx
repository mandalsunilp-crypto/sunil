import { AuthService } from '@/services/authService'
import { InventoryRepository } from '@/repositories/inventoryRepository'
import { SupplierRepository } from '@/repositories/supplierRepository'
import { InvestmentsClient } from '@/components/admin/InvestmentsClient'

export const dynamic = 'force-dynamic'

export default async function AdminInvestmentsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const [batches, suppliers] = await Promise.all([
    InventoryRepository.getAllAdmin(),
    SupplierRepository.getAllAdmin(),
  ])

  const totalInvestment = (batches || []).reduce(
    (sum: number, b: any) => sum + Number(b.unit_cost || 0) * Number(b.quantity || 1),
    0
  )

  return (
    <InvestmentsClient
      batches={batches || []}
      suppliers={suppliers || []}
      totalInvestment={totalInvestment}
    />
  )
}
