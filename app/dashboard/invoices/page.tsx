import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { InvoiceRepository } from '@/repositories/invoiceRepository'
import { SettingsRepository } from '@/repositories/settingsRepository'
import { CustomerInvoicesClient } from '@/components/invoices/CustomerInvoicesClient'

export const dynamic = 'force-dynamic'

export default async function CustomerInvoicesPage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  // Self-service invoice downloads disabled on frontend — redirect to orders
  const isStaff =
    authContext.profile?.role === 'super_admin' ||
    authContext.profile?.role === 'admin' ||
    authContext.profile?.role === 'finance' ||
    authContext.profile?.role === 'support'

  if (!isStaff) {
    redirect('/dashboard/orders')
  }

  const invoices = await InvoiceRepository.getByCustomerId(user.id)

  return <CustomerInvoicesClient initialInvoices={invoices} billingEnabled={false} />
}
