import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { QRPaymentRepository } from '@/repositories/qrPaymentRepository'
import { PaymentSubmissionForm } from '@/components/payments/PaymentSubmissionForm'
import { MemoryStore } from '@/lib/storage/memoryStore'

export const dynamic = 'force-dynamic'

export default async function DirectPayPage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login?redirect=/pay')
  }

  const methods = await QRPaymentRepository.getActiveMethods()

  // Get active pending order or create standard checkout order
  const orders = MemoryStore.getOrders(user.id)
  const pendingOrder = orders.find((o) => o.status === 'pending' || o.status === 'awaiting_payment')

  const orderObj = pendingOrder
    ? {
        ...pendingOrder,
        order_items: [],
        payments: [],
        profiles: { full_name: authContext.profile?.full_name || 'Customer', email: user.email || '' },
      }
    : {
        id: `ord-pay-${Date.now()}`,
        order_number: `VH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        customer_id: user.id,
        subtotal: 2500,
        discount_amount: 0,
        total_amount: 2500,
        currency: 'NPR',
        status: 'pending',
        customer_notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_items: [],
        payments: [],
        profiles: { full_name: authContext.profile?.full_name || 'Customer', email: user.email || '' },
      }

  return (
    <div className="min-h-screen bg-[#040405] text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Nepal Payment QR Code & Transfer Rails
          </h1>
          <p className="text-xs text-neutral-400">
            Scan eSewa, Khalti, or Mobile Banking QR to complete your AI Subscription purchase.
          </p>
        </div>

        <PaymentSubmissionForm order={orderObj as any} methods={methods} />
      </div>
    </div>
  )
}
