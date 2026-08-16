import { AuthService } from '@/services/authService'
import { InventoryRepository } from '@/repositories/inventoryRepository'
import { ProductRepository } from '@/repositories/productRepository'
import { SupplierRepository } from '@/repositories/supplierRepository'
import { InventoryClient } from '@/components/admin/InventoryClient'

export const dynamic = 'force-dynamic'

export default async function AdminInventoryPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const [inventory, products, suppliers] = await Promise.all([
    InventoryRepository.getAllAdmin(),
    ProductRepository.getAll(true),
    SupplierRepository.getAllAdmin(),
  ])

  return (
    <InventoryClient
      initialInventory={inventory}
      products={products}
      suppliers={suppliers}
    />
  )
}
