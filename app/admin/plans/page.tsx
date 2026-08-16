import { AuthService } from '@/services/authService'
import { PlanRepository } from '@/repositories/planRepository'
import { ProductRepository } from '@/repositories/productRepository'
import { PlansClient } from '@/components/admin/PlansClient'

export const dynamic = 'force-dynamic'

export default async function AdminPlansPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const [plans, products] = await Promise.all([
    PlanRepository.getAllAdmin(),
    ProductRepository.getAll(true),
  ])

  return <PlansClient initialPlans={plans} products={products} />
}
