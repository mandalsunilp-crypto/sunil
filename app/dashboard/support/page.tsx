import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { TicketRepository } from '@/repositories/ticketRepository'
import { CustomerSupportClient } from '@/components/support/CustomerSupportClient'

export const dynamic = 'force-dynamic'

export default async function CustomerSupportPage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const tickets = await TicketRepository.getByCustomerId(user.id)

  return <CustomerSupportClient initialTickets={tickets} />
}
