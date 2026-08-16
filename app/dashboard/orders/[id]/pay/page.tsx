import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/services/authService'
import { OrderRepository } from '@/repositories/orderRepository'
import { QRPaymentRepository } from '@/repositories/qrPaymentRepository'
import { PaymentSubmissionForm } from '@/components/payments/PaymentSubmissionForm'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OrderPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const [order, methods] = await Promise.all([
    OrderRepository.getById(id, user.id),
    QRPaymentRepository.getActiveMethods(),
  ])

  if (!order) {
    notFound()
  }

  // If already verified or completed, redirect to order detail
  if (order.status === 'payment_verified' || order.status === 'completed') {
    redirect(`/dashboard/orders/${order.id}`)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <Link
          href={`/dashboard/orders/${order.id}`}
          className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Complete Payment for Order #{order.order_number}
          </h1>
          <p className="text-xs text-neutral-400">
            Scan your preferred payment QR code and submit the transaction receipt.
          </p>
        </div>
      </div>

      <PaymentSubmissionForm order={order} methods={methods} />
    </div>
  )
}
