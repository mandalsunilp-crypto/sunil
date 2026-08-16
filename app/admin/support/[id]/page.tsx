import { notFound } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { TicketRepository } from '@/repositories/ticketRepository'
import { TicketThreadView } from '@/components/support/TicketThreadView'

export const dynamic = 'force-dynamic'

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authContext = await AuthService.requireRole(['super_admin', 'admin', 'support'])

  const ticket = await TicketRepository.getById(id)
  if (!ticket) {
    notFound()
  }

  return (
    <TicketThreadView
      ticket={ticket}
      currentUserId={authContext.user.id}
      isStaff={true}
    />
  )
}
