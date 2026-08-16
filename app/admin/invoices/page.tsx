import { AuthService } from '@/services/authService'
import { InvoiceRepository } from '@/repositories/invoiceRepository'
import { InvoicesClient } from '@/components/admin/InvoicesClient'

export const dynamic = 'force-dynamic'

export default async function AdminInvoicesPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const invoices = await InvoiceRepository.getAllAdmin()

  return <InvoicesClient initialInvoices={invoices} />
}
