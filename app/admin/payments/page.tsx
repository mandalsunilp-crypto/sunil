import { AuthService } from '@/services/authService'
import { PaymentRepository, PaymentWithDetails } from '@/repositories/paymentRepository'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { PaymentsClient } from '@/components/admin/PaymentsClient'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  let payments: PaymentWithDetails[] = []

  try {
    payments = await PaymentRepository.getAllAdmin()
  } catch {
    payments = []
  }

  // Also include Digital Wallet recharge transactions so staff can verify all incoming money in one place
  const walletTxs = MemoryStore.getWalletTransactions()
  const walletPayments: PaymentWithDetails[] = walletTxs
    .filter((tx) => tx.type === 'deposit')
    .map((tx) => ({
      id: tx.id,
      order_id: tx.id,
      customer_id: tx.customer_id,
      payment_method_id: null,
      amount: tx.amount,
      currency: 'NPR',
      payment_reference: tx.reference_id,
      screenshot_url: tx.screenshot_url || '',
      status: tx.status === 'pending' ? 'submitted' : tx.status === 'approved' ? 'verified' : 'rejected',
      customer_notes: tx.notes || null,
      admin_notes: null,
      verified_by: null,
      submitted_at: tx.created_at,
      verified_at: tx.status === 'approved' ? tx.created_at : null,
      created_at: tx.created_at,
      updated_at: tx.created_at,
      orders: {
        order_number: `WALLET-${tx.id.slice(-6).toUpperCase()}`,
        total_amount: tx.amount,
        status: tx.status,
      },
      profiles: {
        full_name: 'Customer Wallet Top-up',
        email: 'user@verifiedhub.com',
        phone: '+977 9714501795',
      },
      qr_payment_methods: {
        name: tx.payment_method || 'Digital Wallet Load (QR)',
        account_name: 'Verified Hub Nepal',
        account_number: '9714501795',
      },
    }))

  // Combine and sort by submitted_at
  const allCombined = [...walletPayments, ...payments]

  return <PaymentsClient initialPayments={allCombined} />
}
