import { AuthService } from '@/services/authService'
import { OrderRepository } from '@/repositories/orderRepository'
import { OrdersClient } from '@/components/admin/OrdersClient'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance', 'support'])

  const orders = await OrderRepository.getAllAdmin()

  return <OrdersClient initialOrders={orders} />
}
