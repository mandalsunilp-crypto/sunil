import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { CustomerProfileClient } from '@/components/profile/CustomerProfileClient'

export const dynamic = 'force-dynamic'

export default async function CustomerProfilePage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user
  const profile = authContext?.profile

  if (!user || !profile) {
    redirect('/login')
  }

  return <CustomerProfileClient profile={profile} />
}
