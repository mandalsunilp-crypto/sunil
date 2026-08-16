import { AuthService } from '@/services/authService'
import { SubscriptionRepository } from '@/repositories/subscriptionRepository'
import { ProductRepository } from '@/repositories/productRepository'
import { PlanRepository } from '@/repositories/planRepository'
import { ProfileRepository } from '@/repositories/profileRepository'
import { SubscriptionsClient } from '@/components/admin/SubscriptionsClient'

export const dynamic = 'force-dynamic'

export default async function AdminSubscriptionsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance', 'support'])

  const [subscriptions, products, plans, customers] = await Promise.all([
    SubscriptionRepository.getAllAdmin(),
    ProductRepository.getAll(true),
    PlanRepository.getAllAdmin(),
    ProfileRepository.getAllAdmin(),
  ])

  return (
    <SubscriptionsClient
      initialSubscriptions={subscriptions}
      products={products}
      plans={plans}
      customers={customers}
    />
  )
}
