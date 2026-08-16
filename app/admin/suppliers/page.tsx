import { AuthService } from '@/services/authService'
import { SupplierRepository } from '@/repositories/supplierRepository'
import { SuppliersClient } from '@/components/admin/SuppliersClient'

export const dynamic = 'force-dynamic'

export default async function AdminSuppliersPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const suppliers = await SupplierRepository.getAllAdmin()

  return <SuppliersClient initialSuppliers={suppliers} />
}
