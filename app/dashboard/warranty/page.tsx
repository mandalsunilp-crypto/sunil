import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { WarrantyRepository } from '@/repositories/warrantyRepository'
import { SubscriptionRepository } from '@/repositories/subscriptionRepository'
import { CustomerWarrantyClient } from '@/components/warranty/CustomerWarrantyClient'

export const dynamic = 'force-dynamic'

export default async function CustomerWarrantyPage({
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

  const [claims, allSubscriptions] = await Promise.all([
    WarrantyRepository.getByCustomerId(user.id),
    SubscriptionRepository.getByCustomerId(user.id),
  ])

  // Filter subscriptions eligible for warranty (active subscriptions or unexpired warranty)
  const now = new Date()
  const activeSubs = allSubscriptions.filter((s) => s.status === 'active')
  const eligibleSubscriptions = activeSubs.length > 0 ? activeSubs : allSubscriptions

  return (
    <CustomerWarrantyClient
      initialClaims={claims}
      eligibleSubscriptions={eligibleSubscriptions}
      preselectedSubscriptionId={sParams?.subscriptionId}
    />
  )
}
