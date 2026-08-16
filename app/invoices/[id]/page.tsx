import { notFound, redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { InvoiceRepository } from '@/repositories/invoiceRepository'
import { InvoiceView } from '@/components/invoices/InvoiceView'

export const dynamic = 'force-dynamic'

export default async function InvoiceDetailPage({
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

  const isStaff =
    authContext.profile?.role === 'super_admin' ||
    authContext.profile?.role === 'admin' ||
    authContext.profile?.role === 'finance' ||
    authContext.profile?.role === 'support'

  if (!isStaff) {
    redirect('/dashboard')
  }

  const invoice = await InvoiceRepository.getById(
    id,
    isStaff ? undefined : user.id
  )

  if (!invoice) {
    notFound()
  }

  return <InvoiceView invoice={invoice} />
}
