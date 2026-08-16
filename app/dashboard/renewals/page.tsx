import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { RenewalRepository } from '@/repositories/renewalRepository'
import { SubscriptionRepository } from '@/repositories/subscriptionRepository'
import { PlanRepository } from '@/repositories/planRepository'
import { CustomerRenewalsClient } from '@/components/renewals/CustomerRenewalsClient'

export const dynamic = 'force-dynamic'

export default async function CustomerRenewalsPage({
  searchParams,
}: {
  searchParams: Promise<{ subscriptionId?: string }>
}) {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const sParams = await searchParams

  const [renewals, subscriptions] = await Promise.all([
    RenewalRepository.getByCustomerId(user.id),
    SubscriptionRepository.getByCustomerId(user.id),
  ])

  // Get active subscriptions
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.status === 'expired')

  // Find target plans for preselected subscription or all available plans
  const targetSub = activeSubscriptions.find((s) => s.id === sParams?.subscriptionId) || activeSubscriptions[0]
  const availablePlans = targetSub?.product_id
    ? await PlanRepository.getPublicByProductId(targetSub.product_id)
    : []

  return (
    <CustomerRenewalsClient
      initialRenewals={renewals}
      activeSubscriptions={activeSubscriptions}
      availablePlans={availablePlans}
      preselectedSubscriptionId={sParams?.subscriptionId}
    />
  )
}
