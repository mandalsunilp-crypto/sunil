'use client'

import React from 'react'
import Link from 'next/link'
import { InvoiceWithDetails } from '@/repositories/invoiceRepository'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Download,
} from 'lucide-react'

export function InvoiceView({ invoice }: { invoice: InvoiceWithDetails }) {
  const isPaid = invoice.status === 'paid'
  const isCancelled = invoice.status === 'cancelled'
  const isRefunded = invoice.status === 'refunded'

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Print Actions (Hidden on print) */}
        <div className="flex items-center justify-between print:hidden">
          <Link href="/dashboard/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Invoices</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>

        {/* Invoice Printable Card */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Top Status Watermark / Stamp */}
          <div className="flex items-start justify-between border-b border-neutral-800 print:border-neutral-300 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  VH
                </div>
                <span className="text-xl font-bold tracking-tight text-white print:text-black">
                  VERIFIED HUB
                </span>
              </div>
              <p className="text-xs text-neutral-400 print:text-neutral-600 leading-relaxed">
                Kathmandu, Bagmati Province, Nepal<br />
                support@verifiedhub.com • +977 9800000000<br />
                PAN / VAT Reg: <strong>610984512</strong>
              </p>
            </div>

            <div className="text-right space-y-2">
              <h1 className="text-2xl font-black text-white print:text-black tracking-tight">
                INVOICE
              </h1>
              <div className="font-mono text-xs font-semibold text-blue-400 print:text-blue-700">
                #{invoice.invoice_number}
              </div>
              <div>
                <Badge
                  variant={isPaid ? 'success' : isCancelled || isRefunded ? 'danger' : 'warning'}
                  size="md"
                  className="uppercase font-bold tracking-wider"
                >
                  {invoice.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Billing & Invoice Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs border-b border-neutral-800 print:border-neutral-300 pb-8">
            <div className="space-y-1">
              <span className="text-neutral-400 print:text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                Billed To
              </span>
              <p className="font-bold text-white print:text-black text-sm">
                {invoice.profiles?.full_name || invoice.billing_address?.full_name || 'Walk-in Customer'}
              </p>
              <p className="text-neutral-400 print:text-neutral-700">
                {invoice.profiles?.email || invoice.billing_address?.email || 'customer@verifiedhub.com'}
              </p>
              {(invoice.profiles?.phone || invoice.billing_address?.phone) && (
                <p className="text-neutral-400 print:text-neutral-700 font-mono">
                  {invoice.profiles?.phone || invoice.billing_address?.phone}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-neutral-400 print:text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                Order & Payment
              </span>
              <p className="text-neutral-300 print:text-neutral-800">
                Order #{invoice.orders?.order_number}
              </p>
              <p className="text-neutral-300 print:text-neutral-800">
                Payment: QR Code / Mobile Banking
              </p>
              {invoice.paid_at && (
                <p className="text-emerald-400 print:text-emerald-700 font-medium">
                  Paid on {formatDate(invoice.paid_at)}
                </p>
              )}
            </div>

            <div className="space-y-1 text-right sm:text-left">
              <span className="text-neutral-400 print:text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                Dates
              </span>
              <p className="text-neutral-300 print:text-neutral-800">
                Issued: {formatDate(invoice.invoice_date)}
              </p>
              <p className="text-neutral-300 print:text-neutral-800">
                Due: {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="space-y-4">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 print:border-neutral-300 text-neutral-400 print:text-neutral-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5">Item & Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 print:divide-neutral-300">
                {invoice.orders?.order_items && invoice.orders.order_items.length > 0 ? (
                  invoice.orders.order_items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3.5">
                        <p className="font-semibold text-white print:text-black">{item.product_name}</p>
                        <p className="text-[11px] text-neutral-400 print:text-neutral-600">{item.plan_name}</p>
                      </td>
                      <td className="py-3.5 text-center text-neutral-300 print:text-neutral-800">
                        {item.quantity}
                      </td>
                      <td className="py-3.5 text-right text-neutral-300 print:text-neutral-800">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3.5 text-right font-medium text-white print:text-black">
                        {formatCurrency(item.total_price)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3.5 font-semibold text-white print:text-black">
                      AI Tool Subscription License
                    </td>
                    <td className="py-3.5 text-center text-neutral-300 print:text-neutral-800">1</td>
                    <td className="py-3.5 text-right text-neutral-300 print:text-neutral-800">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                    <td className="py-3.5 text-right font-medium text-white print:text-black">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="flex justify-end pt-4 border-t border-neutral-800 print:border-neutral-300">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400 print:text-neutral-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-white print:text-black">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-400 print:text-emerald-700">
                    <span>Coupon Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}

                {invoice.tax_amount && invoice.tax_amount > 0 ? (
                  <div className="flex justify-between text-amber-400 print:text-amber-700 font-semibold">
                    <span>Nepal VAT (13%):</span>
                    <span className="font-mono">+{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-neutral-400 print:text-neutral-600">
                    <span>Tax / VAT (13%):</span>
                    <span className="text-neutral-400 print:text-neutral-600">Included / NPR 0.00</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-white print:text-black border-t border-neutral-800 print:border-neutral-300 pt-2">
                  <span>Total Due / Paid:</span>
                  <span className="text-blue-400 print:text-black">
                    {formatCurrency(invoice.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee & Terms Footer */}
          <div className="border-t border-neutral-800 print:border-neutral-300 pt-6 text-[11px] text-neutral-400 print:text-neutral-600 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 print:text-emerald-800 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Hub 100% Replacement Warranty Guaranteed</span>
            </div>
            <p className="leading-relaxed">
              Thank you for choosing Verified Hub. For any subscription questions or warranty claims, visit our customer portal at verifiedhub.com/dashboard/warranty or contact our 24/7 support desk.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
