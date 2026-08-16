import { notFound, redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { TicketRepository } from '@/repositories/ticketRepository'
import { TicketThreadView } from '@/components/support/TicketThreadView'

export const dynamic = 'force-dynamic'

export default async function CustomerTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const ticket = await TicketRepository.getById(id, user.id)
  if (!ticket) {
    notFound()
  }

  return (
    <TicketThreadView
      ticket={ticket}
      currentUserId={user.id}
      isStaff={false}
    />
  )
}
