'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { InvoiceWithDetails } from '@/repositories/invoiceRepository'
import { GenerateBillModal } from '@/components/admin/GenerateBillModal'
import { adminUpdateInvoiceStatusAction } from '@/features/invoices/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Search,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Plus,
  Loader2,
  Mail,
  Phone,
  User,
} from 'lucide-react'

export function InvoicesClient({ initialInvoices }: { initialInvoices: InvoiceWithDetails[] }) {
  const router = useRouter()
  const [invoices, setInvoices] = useState(initialInvoices)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const totalPaid = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const totalUnpaid = invoices
    .filter((inv) => inv.status === 'issued' || inv.status === 'draft')
    .reduce((sum, inv) => sum + Number(inv.total_amount), 0)

  const filteredInvoices = invoices.filter((inv) => {
    const s = searchQuery.toLowerCase()
    const customerName = inv.profiles?.full_name || inv.billing_address?.full_name || ''
    const customerEmail = inv.profiles?.email || inv.billing_address?.email || ''
    const customerPhone = inv.profiles?.phone || inv.billing_address?.phone || ''

    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(s) ||
      (inv.orders?.order_number && inv.orders.order_number.toLowerCase().includes(s)) ||
      customerName.toLowerCase().includes(s) ||
      customerEmail.toLowerCase().includes(s) ||
      customerPhone.toLowerCase().includes(s)

    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter

    return matchesSearch && matchesStatus
  })

  async function handleTogglePaidStatus(invoiceId: string, currentStatus: string) {
    const newStatus = currentStatus === 'paid' ? 'issued' : 'paid'
    setUpdatingId(invoiceId)

    // Optimistic UI update
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv))
    )

    const res = await adminUpdateInvoiceStatusAction(invoiceId, newStatus as any)
    setUpdatingId(null)

    if (!res.success) {
      // Revert on error
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: currentStatus as any } : inv))
      )
      alert(res.message || 'Failed to update payment status.')
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Invoices & Billing Ledger</h1>
          <p className="text-xs text-neutral-400">
            Audit tax invoices, generate on-demand customer bills, track payments, and update status.
          </p>
        </div>

        <Button
          onClick={() => setBillModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Generate Customer Bill / Invoice</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Gross Invoiced Revenue</span>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalInvoiced)}</p>
          <span className="text-[10px] text-neutral-500">{invoices.length} Total Invoices</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Collected & Settled</span>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalPaid)}</p>
          <span className="text-[10px] text-neutral-500">
            {invoices.filter((i) => i.status === 'paid').length} Paid Invoices
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Pending Invoices</span>
          <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalUnpaid)}</p>
          <span className="text-[10px] text-neutral-500">Awaiting Customer Settlement</span>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Invoice #, Order #, Customer Name, Email, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Statuses ({invoices.length})</option>
              <option value="paid">Paid</option>
              <option value="issued">Issued / Unpaid</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card className="p-0 overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <EmptyState
            title="No Invoices Found"
            description="Generate a custom bill or wait for incoming customer checkouts."
            action={
              <Button onClick={() => setBillModalOpen(true)} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Generate Bill
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Order Ref</th>
                  <th className="p-3.5">Customer Name & Contact</th>
                  <th className="p-3.5">Date Created</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Payment System</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredInvoices.map((inv) => {
                  const customerName =
                    inv.profiles?.full_name ||
                    inv.billing_address?.full_name ||
                    'Walk-in Customer'
                  const customerEmail =
                    inv.profiles?.email ||
                    inv.billing_address?.email ||
                    'customer@verifiedhub.com'
                  const customerPhone =
                    inv.profiles?.phone || inv.billing_address?.phone || null
                  const isPaid = inv.status === 'paid'

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white">
                        #{inv.invoice_number}
                      </td>
                      <td className="p-3.5 font-mono text-neutral-400">
                        {inv.orders?.order_number ? `#${inv.orders.order_number}` : 'Custom Bill'}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="font-bold text-white">{customerName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                            <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="font-mono">{customerEmail}</span>
                          </div>
                          {customerPhone && (
                            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                              <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span className="font-mono text-emerald-400">{customerPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-400">
                        {formatDate(inv.created_at)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-white font-mono text-sm">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            isPaid
                              ? 'success'
                              : inv.status === 'issued'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {inv.status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Payment Status Action Button */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleTogglePaidStatus(inv.id, inv.status)}
                          disabled={updatingId === inv.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                            isPaid
                              ? 'bg-emerald-950/60 hover:bg-amber-950/60 text-emerald-300 hover:text-amber-300 border-emerald-700/50 hover:border-amber-700/50'
                              : 'bg-amber-950/60 hover:bg-emerald-950/60 text-amber-300 hover:text-emerald-300 border-amber-700/50 hover:border-emerald-700/50'
                          }`}
                          title={isPaid ? 'Click to mark as Unpaid' : 'Click to mark as Paid'}
                        >
                          {updatingId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>{isPaid ? 'PAID ✓ (Mark Unpaid)' : 'UNPAID (Mark Paid)'}</span>
                        </button>
                      </td>

                      <td className="p-3.5 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white font-semibold text-[11px] transition-colors border border-purple-500/30"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Invoice</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Generate Bill Modal */}
      {billModalOpen && (
        <GenerateBillModal
          onClose={() => setBillModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
