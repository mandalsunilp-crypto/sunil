import { AuthService } from '@/services/authService'
import { TicketRepository } from '@/repositories/ticketRepository'
import { SupportClient } from '@/components/admin/SupportClient'

export const dynamic = 'force-dynamic'

export default async function AdminSupportPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'support'])

  const tickets = await TicketRepository.getAllAdmin()

  return <SupportClient initialTickets={tickets} />
}
