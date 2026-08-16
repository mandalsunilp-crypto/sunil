import { AuthService } from '@/services/authService'
import { QRPaymentRepository } from '@/repositories/qrPaymentRepository'
import { QRMethodsClient } from '@/components/admin/QRMethodsClient'

export const dynamic = 'force-dynamic'

export default async function AdminQRPaymentsPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const methods = await QRPaymentRepository.getAllAdmin()

  return <QRMethodsClient initialMethods={methods} />
}
