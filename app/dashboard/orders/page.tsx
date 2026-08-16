import Link from 'next/link'
import { AuthService } from '@/services/authService'
import { OrderRepository } from '@/repositories/orderRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ShoppingBag,
  ArrowRight,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerOrdersPage() {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user

  const orders = await OrderRepository.getByCustomerId(user?.id || '')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Orders</h1>
          <p className="text-xs text-neutral-400">
            View all your subscription orders, download invoices, and check payment status.
          </p>
        </div>

        <Link href="/dashboard/products">
          <Button variant="primary" size="sm">
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            <span>Place New Order</span>
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No Orders Placed Yet"
          description="You have not placed any orders yet. Choose an AI tool from our catalog to get started."
          action={
            <Link href="/dashboard/products">
              <Button variant="primary" size="sm">
                Browse AI Subscriptions
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const firstItem = order.order_items?.[0]
            const isAwaitingPayment =
              order.status === 'pending' ||
              order.status === 'awaiting_payment' ||
              order.status === 'payment_submitted'

            return (
              <Card key={order.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-white">#{order.order_number}</span>
                    <Badge
                      variant={
                        order.status === 'completed' || order.status === 'payment_verified'
                          ? 'success'
                          : order.status === 'payment_submitted'
                          ? 'primary'
                          : order.status === 'pending' || order.status === 'awaiting_payment'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="text-xs text-neutral-300">
                    <strong>{firstItem?.product_name || 'AI Product'}</strong> — {firstItem?.plan_name} ({firstItem?.duration_days} Days)
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                    <span>Date: {formatDate(order.created_at)}</span>
                    <span>•</span>
                    <span>Subtotal: {formatCurrency(order.subtotal)}</span>
                    {order.discount_amount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">Discount: -{formatCurrency(order.discount_amount)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-neutral-500 block uppercase font-medium">Total Amount</span>
                    <div className="text-base font-bold text-white">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button
                        variant={isAwaitingPayment ? 'primary' : 'outline'}
                        size="sm"
                        className="text-xs"
                      >
                        {isAwaitingPayment ? (
                          <>
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            <span>Payment & Details</span>
                          </>
                        ) : (
                          <>
                            <span>View Order</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
