import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/services/authService'
import { OrderRepository } from '@/repositories/orderRepository'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  if (!user) {
    redirect('/login')
  }

  const order = await OrderRepository.getById(id, user.id)

  if (!order) {
    notFound()
  }

  const item = order.order_items?.[0]
  const invoice = order.invoices
  const payments = order.payments || []
  const latestPayment = payments[payments.length - 1]

  const isPaid = order.status === 'payment_verified' || order.status === 'completed'
  const isPaymentSubmitted = order.status === 'payment_submitted'
  const isAwaitingPayment = order.status === 'pending' || order.status === 'awaiting_payment'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders"
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">
                #{order.order_number}
              </h1>
              <Badge
                variant={
                  isPaid ? 'success' : isPaymentSubmitted ? 'primary' : isAwaitingPayment ? 'warning' : 'default'
                }
                size="sm"
              >
                {order.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-neutral-400">Placed on {formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice && (
            <Link href={`/dashboard/invoices`}>
              <Button variant="outline" size="sm">
                <FileText className="w-3.5 h-3.5 mr-1" />
                <span>Invoice #{invoice.invoice_number}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Workflow Step Tracker */}
      <Card className="p-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
          Order Lifecycle Status
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          {/* Step 1: Order Created */}
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-emerald-500/40 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Order Placed</span>
            </div>
            <p className="text-[11px] text-neutral-400">Snapshot locked & invoice generated</p>
          </div>

          {/* Step 2: Payment Proof */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              isPaymentSubmitted || isPaid || latestPayment
                ? 'bg-neutral-900/80 border-emerald-500/40'
                : 'bg-amber-950/20 border-amber-500/40'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isPaymentSubmitted || isPaid || latestPayment ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isPaymentSubmitted || isPaid || latestPayment ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4 animate-pulse" />
              )}
              <span>2. Payment Proof</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {isPaid
                ? 'Payment verified'
                : isPaymentSubmitted || latestPayment
                ? 'Screenshot submitted'
                : 'Pending upload — submit receipt'}
            </p>
          </div>

          {/* Step 3: Admin Verification */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              isPaid
                ? 'bg-neutral-900/80 border-emerald-500/40'
                : isPaymentSubmitted || latestPayment
                ? 'bg-blue-950/30 border-blue-500/50'
                : 'bg-neutral-950/40 border-neutral-800'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isPaid ? 'text-emerald-400' : isPaymentSubmitted || latestPayment ? 'text-blue-400' : 'text-neutral-500'
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isPaymentSubmitted || latestPayment ? (
                <Clock className="w-4 h-4 animate-pulse" />
              ) : (
                <Clock className="w-4 h-4 text-neutral-600" />
              )}
              <span>3. Verification</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {isPaid
                ? 'Payment verified'
                : isPaymentSubmitted || latestPayment
                ? 'Staff reviewing...'
                : 'Awaiting payment proof'}
            </p>
          </div>

          {/* Step 4: Subscription Active */}
          <div
            className={`p-3 rounded-xl border space-y-1 ${
              isPaid
                ? 'bg-neutral-900/80 border-emerald-500/40'
                : order.status === 'cancelled' || order.status === 'refunded'
                ? 'bg-red-950/30 border-red-800/40'
                : 'bg-neutral-950/40 border-neutral-800'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isPaid
                  ? 'text-emerald-400'
                  : order.status === 'cancelled' || order.status === 'refunded'
                  ? 'text-red-400'
                  : 'text-neutral-500'
              }`}
            >
              {isPaid ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : order.status === 'cancelled' || order.status === 'refunded' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4 text-neutral-600" />
              )}
              <span>4. Activation</span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {isPaid
                ? 'Active & Protected'
                : order.status === 'cancelled'
                ? 'Order Cancelled'
                : order.status === 'refunded'
                ? 'Order Refunded'
                : 'Activates on verification'}
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Action Callout if awaiting payment */}
      {isAwaitingPayment && (
        <Card className="p-6 bg-gradient-to-br from-amber-950/30 to-neutral-900 border-amber-800/50 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <QrCode className="w-4 h-4" />
                <span>Action Required: Complete QR Payment</span>
              </div>
              <p className="text-xs text-neutral-300">
                To activate your subscription, please submit your eSewa, Khalti, or Bank Transfer payment receipt.
              </p>
            </div>
            <span className="text-xl font-bold text-white">
              {formatCurrency(order.total_amount)}
            </span>
          </div>

          <div className="pt-2">
            <Link href={`/dashboard/orders/${order.id}/pay`}>
              <Button variant="primary" size="md" className="w-full sm:w-auto">
                <CreditCard className="w-4 h-4 mr-1.5" />
                <span>View Payment QR & Upload Screenshot</span>
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Order Item Snapshot & Breakdown */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-3">
          Order Items & Pricing Snapshot
        </h3>

        {item ? (
          <div className="flex items-center justify-between py-2 border-b border-neutral-800/60 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-white">{item.product_name}</h4>
              <p className="text-neutral-400">{item.plan_name} ({item.duration_days} Days)</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                <span>Warranty: {item.warranty_days} Days</span>
                <span>•</span>
                <span>Qty: {item.quantity}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="font-bold text-white text-sm">{formatCurrency(item.total_price)}</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-neutral-500">No items attached.</p>
        )}

        <div className="space-y-2 text-xs pt-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>

          {order.discount_amount > 0 && (
            <div className="flex items-center justify-between text-emerald-400">
              <span>Coupon Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-base font-extrabold text-white pt-2 border-t border-neutral-800">
            <span>Final Paid Amount</span>
            <span className="text-blue-400">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        {order.customer_notes && (
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1">
            <span className="text-neutral-400 font-medium">Customer Notes:</span>
            <p className="text-neutral-200">{order.customer_notes}</p>
          </div>
        )}
      </Card>
    </div>
  )
}
