'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  FileText,
  Printer,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Building,
  CheckCircle2,
} from 'lucide-react'

export function FinancialReportsClient({
  analytics,
  orders,
  expenses,
}: {
  analytics: any
  orders: any[]
  expenses: any[]
}) {
  const [selectedMonth, setSelectedMonth] = useState('Current Period')

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial & Tax Reports</h1>
          <p className="text-xs text-neutral-400">
            Exportable monthly income statement, VAT/PAN sales summary, and expense audit report.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handlePrint} variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500">
            <Printer className="w-4 h-4 mr-1.5" />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <Card className="p-8 sm:p-10 space-y-8 bg-neutral-950 border border-neutral-800 text-white print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-neutral-800 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white">VERIFIED HUB NEPAL PVT. LTD.</span>
              <Badge variant="purple" size="sm">OFFICIAL REPORT</Badge>
            </div>
            <p className="text-xs text-neutral-400">Kathmandu, Nepal • PAN / VAT #: 610984512</p>
            <p className="text-xs text-neutral-400">Support: +977 9714501795 • support@verifiedhub.com</p>
          </div>

          <div className="text-left sm:text-right text-xs text-neutral-400 space-y-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Statement of Revenue & Expenses</h2>
            <p>Period: <strong>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</strong></p>
            <p>Generated: <strong>{formatDate(new Date().toISOString())}</strong></p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 font-medium">Gross Collected Sales</span>
            <p className="text-xl font-bold text-white">{formatCurrency(analytics.grossRevenue)}</p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 font-medium">Total Cost of Goods (COGS)</span>
            <p className="text-xl font-bold text-amber-400">-{formatCurrency(analytics.totalCogs)}</p>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1">
            <span className="text-purple-300 font-medium">Net Profit (EBITDA)</span>
            <p className="text-xl font-black text-emerald-400">{formatCurrency(analytics.netProfit)}</p>
          </div>
        </div>

        {/* Detailed Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white border-b border-neutral-800 pb-2">
            1. Income & Margin Breakdown
          </h3>
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-neutral-800">
              <tr className="py-2">
                <td className="py-2.5 text-neutral-300">Gross Subscription Sales (Customer Invoices)</td>
                <td className="py-2.5 text-right font-semibold text-white">{formatCurrency(analytics.grossRevenue)}</td>
              </tr>
              <tr className="py-2">
                <td className="py-2.5 text-neutral-400">Less: Coupon Discounts & Promotional Deductions</td>
                <td className="py-2.5 text-right text-emerald-400">-{formatCurrency(analytics.totalDiscounts)}</td>
              </tr>
              <tr className="py-2 font-bold bg-neutral-900/40">
                <td className="py-2.5 px-2 text-white">Net Operating Revenue</td>
                <td className="py-2.5 px-2 text-right text-white">{formatCurrency(analytics.netRevenue)}</td>
              </tr>
              <tr className="py-2">
                <td className="py-2.5 text-neutral-400">Less: Supplier Inventory Investment (COGS)</td>
                <td className="py-2.5 text-right text-red-400">-{formatCurrency(analytics.totalCogs)}</td>
              </tr>
              <tr className="py-2 font-bold bg-neutral-900/40">
                <td className="py-2.5 px-2 text-emerald-400">Gross Profit ({analytics.grossMarginPct?.toFixed(1) || 0}% Margin)</td>
                <td className="py-2.5 px-2 text-right text-emerald-400">{formatCurrency(analytics.grossProfit)}</td>
              </tr>
              <tr className="py-2">
                <td className="py-2.5 text-neutral-400">Less: Operating Expenses (Marketing, Software, Fees, Warranty)</td>
                <td className="py-2.5 text-right text-red-400">-{formatCurrency(analytics.totalExpenses)}</td>
              </tr>
              <tr className="py-2 font-black text-sm bg-purple-950/30 border-t-2 border-neutral-800">
                <td className="py-3 px-2 text-white">Net Profit for Period</td>
                <td className="py-3 px-2 text-right text-emerald-400">{formatCurrency(analytics.netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signature & Compliance Footer */}
        <div className="pt-8 border-t border-neutral-800 grid grid-cols-2 gap-8 text-xs text-neutral-400">
          <div className="space-y-1">
            <span className="font-semibold text-white">Tax Compliance Note:</span>
            <p className="text-[11px] leading-relaxed">
              This financial statement is generated by the Verified Hub accounting ledger for internal audit and Nepal IRD tax filing compliance.
            </p>
          </div>
          <div className="text-right space-y-4">
            <span className="block text-[11px]">Authorized by Financial Controller:</span>
            <div className="pt-6 border-b border-neutral-700 w-48 ml-auto"></div>
            <span className="block text-[10px] text-neutral-500">Verified Hub Management</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
