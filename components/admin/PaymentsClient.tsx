'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PaymentWithDetails } from '@/repositories/paymentRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaymentVerificationModal } from '@/components/admin/PaymentVerificationModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

export function PaymentsClient({ initialPayments }: { initialPayments: PaymentWithDetails[] }) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('submitted')
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null)

  const pendingCount = payments.filter((p) => p.status === 'submitted').length
  const verifiedCount = payments.filter((p) => p.status === 'verified').length
  const rejectedCount = payments.filter((p) => p.status === 'rejected').length

  const filteredPayments = payments.filter((p) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      (p.orders?.order_number && p.orders.order_number.toLowerCase().includes(s)) ||
      (p.profiles?.full_name && p.profiles.full_name.toLowerCase().includes(s)) ||
      (p.profiles?.email && p.profiles.email.toLowerCase().includes(s)) ||
      (p.payment_reference && p.payment_reference.toLowerCase().includes(s))

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payment Verification Queue</h1>
          <p className="text-xs text-neutral-400">
            Review incoming Nepal QR payment receipts, verify transactions, and auto-dispatch licenses.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'submitted'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('verified')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified ({verifiedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({rejectedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              All Payments ({payments.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ref #, Order #, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="p-0 overflow-hidden">
        {filteredPayments.length === 0 ? (
          <EmptyState
            title="No Payments in this Queue"
            description="All payment receipts in this category have been processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Gateway & Ref</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Receipt</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-white">
                      #{p.orders?.order_number || 'N/A'}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-medium text-white">{p.profiles?.full_name || 'Customer'}</span>
                        <p className="text-[11px] text-neutral-400">{p.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="text-neutral-200">{p.qr_payment_methods?.name || 'Local QR'}</span>
                        <p className="font-mono text-[11px] text-amber-400">
                          Ref: {p.payment_reference || '—'}
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3.5">
                      {p.screenshot_url ? (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium text-[11px]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-neutral-600">No Image</span>
                      )}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {formatDate(p.submitted_at || p.created_at)}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          p.status === 'verified'
                            ? 'success'
                            : p.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedPayment(p)}
                        className="bg-purple-600 hover:bg-purple-500 text-[11px] py-1 px-3"
                      >
                        {p.status === 'submitted' ? 'Review & Verify' : 'View Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Verification Modal */}
      {selectedPayment && (
        <PaymentVerificationModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
