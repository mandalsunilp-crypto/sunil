'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { InvoiceWithDetails } from '@/repositories/invoiceRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Download,
  ExternalLink,
  Printer,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldAlert,
  Lock,
} from 'lucide-react'

export function CustomerInvoicesClient({
  initialInvoices,
  billingEnabled = true,
}: {
  initialInvoices: InvoiceWithDetails[]
  billingEnabled?: boolean
}) {
  const [invoices] = useState(initialInvoices)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-xs text-neutral-400">
            View, download, and print official VAT receipts and tax invoices for all your subscription purchases.
          </p>
        </div>
      </div>

      {/* Disabled Banner when Admin turns off Self-Service Billing */}
      {!billingEnabled && (
        <Card className="p-5 border-amber-800/40 bg-amber-950/20 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Self-Service Invoice Printing Currently Disabled</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Self-service tax bill generation and printing is temporarily disabled by Verified Hub Administration. If you require an official PDF/printed VAT invoice for accounting or tax filing, please contact our support team via WhatsApp.
          </p>
          <div className="pt-1">
            <a
              href="https://wa.me/9779714501795?text=Hello%20Verified%20Hub%20Support,%20I%20need%20my%20official%20printed%20invoice"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Contact Support on WhatsApp (+977 9714501795)</span>
            </a>
          </div>
        </Card>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <EmptyState
          title="No Invoices Issued"
          description="You do not have any invoices yet. Invoices are generated automatically upon order placement."
          action={
            <Link href="/dashboard/products">
              <Button variant="primary" size="sm">
                Explore AI Subscriptions
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Order #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-white">
                      #{inv.invoice_number}
                    </td>
                    <td className="p-3.5 font-mono text-neutral-300">
                      #{inv.orders?.order_number}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          inv.status === 'paid'
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
                    <td className="p-3.5 text-right">
                      {billingEnabled ? (
                        <Link href={`/invoices/${inv.id}`} target="_blank">
                          <Button variant="primary" size="sm" className="bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] py-1 px-3">
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            <span>View & Print Tax Invoice</span>
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-neutral-500 italic flex items-center justify-end gap-1">
                          <Lock className="w-3 h-3 text-amber-500" />
                          Disabled by Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
