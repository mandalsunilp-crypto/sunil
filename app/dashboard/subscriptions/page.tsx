import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { SubscriptionRepository } from '@/repositories/subscriptionRepository'
import { CustomerSubscriptionsClient } from '@/components/subscriptions/CustomerSubscriptionsClient'

export const dynamic = 'force-dynamic'

export default async function CustomerSubscriptionsPage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const subscriptions = await SubscriptionRepository.getByCustomerId(user.id)

  return <CustomerSubscriptionsClient initialSubscriptions={subscriptions} />
}
