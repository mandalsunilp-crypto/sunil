'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  DollarSign,
  TrendingUp,
  Receipt,
  BookOpen,
  PiggyBank,
  FileText,
  ShieldCheck,
  ArrowRight,
  Plus,
  Layers,
} from 'lucide-react'

export function FinanceOverviewClient({
  analytics,
  accountBalances,
}: {
  analytics: any
  accountBalances: Record<string, number>
}) {
  const isProfitable = analytics.netProfit >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Finance & Accounting Overview</h1>
          <p className="text-xs text-neutral-400">
            Real-time financial position, general ledger balances, gross/net margins, and cash flow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/expenses">
            <Button variant="outline" size="sm">
              <Receipt className="w-4 h-4 mr-1.5 text-red-400" />
              <span>Record Expense</span>
            </Button>
          </Link>
          <Link href="/admin/invoices">
            <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500">
              <FileText className="w-4 h-4 mr-1.5" />
              <span>Invoices & Billing</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Net Sales Revenue</span>
          <p className="text-2xl font-black text-white">{formatCurrency(analytics.netRevenue)}</p>
          <span className="text-[10px] text-neutral-500">
            Gross: {formatCurrency(analytics.grossRevenue)} (After {formatCurrency(analytics.totalDiscounts)} discounts)
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Gross Profit</span>
          <p className="text-2xl font-black text-emerald-400">{formatCurrency(analytics.grossProfit)}</p>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {analytics.grossMarginPct?.toFixed(1) || 0}% Gross Margin (COGS: {formatCurrency(analytics.totalCogs)})
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Operating Overhead</span>
          <p className="text-2xl font-black text-red-400">-{formatCurrency(analytics.totalExpenses)}</p>
          <span className="text-[10px] text-neutral-500">
            Marketing, tools, and {formatCurrency(analytics.warrantyCosts)} warranty replacements
          </span>
        </Card>

        <Card className="p-4 space-y-1 border-purple-500/40 bg-purple-950/10">
          <span className="text-purple-300 font-medium">Net Bottom Line</span>
          <p className={`text-2xl font-black ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(analytics.netProfit)}
          </p>
          <span className={`text-[10px] font-bold ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
            {analytics.netMarginPct?.toFixed(1) || 0}% Net Margin
          </span>
        </Card>
      </div>

      {/* Chart of Accounts & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Balance Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Chart of Accounts Balances</h3>
                <p className="text-xs text-neutral-400">Double-entry accounting ledger accounts.</p>
              </div>
              <Link href="/admin/ledger">
                <Button variant="secondary" size="sm" className="text-xs">
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  <span>View Journal</span>
                </Button>
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">Cash & Bank Balance (eSewa / Khalti / Bank)</span>
                  <p className="text-[11px] text-neutral-400">Total liquid funds collected</p>
                </div>
                <strong className="text-sm font-black text-emerald-400">
                  {formatCurrency(accountBalances['cash_bank'] || analytics.netRevenue)}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">Cost of Goods Sold (Supplier Plans)</span>
                  <p className="text-[11px] text-neutral-400">Direct investment costs for provisioned tools</p>
                </div>
                <strong className="text-sm font-bold text-neutral-200">
                  {formatCurrency(accountBalances['cost_of_goods_sold'] || analytics.totalCogs)}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">Operating Expenses Account</span>
                  <p className="text-[11px] text-neutral-400">Advertising, software tools, payment fees</p>
                </div>
                <strong className="text-sm font-bold text-red-400">
                  -{formatCurrency(accountBalances['operating_expense'] || analytics.totalExpenses)}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">Promotional Discounts Incurred</span>
                  <p className="text-[11px] text-neutral-400">Launch promo and coupon deductions</p>
                </div>
                <strong className="text-sm font-bold text-amber-400">
                  -{formatCurrency(analytics.totalDiscounts)}
                </strong>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Quick Module Nav (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 space-y-3">
            <h3 className="text-base font-bold text-white">Financial Navigation</h3>
            <p className="text-xs text-neutral-400">Access specialized financial reporting modules.</p>

            <div className="space-y-2 pt-2">
              <Link
                href="/admin/profit"
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 flex items-center justify-between text-xs font-medium text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Profit & Loss (P&L) Statement</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/reports"
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 flex items-center justify-between text-xs font-medium text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Monthly Tax & Financial Reports</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/investments"
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 flex items-center justify-between text-xs font-medium text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <PiggyBank className="w-4 h-4 text-purple-400" />
                  <span>Supplier Investments & Inventory Cost</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/ledger"
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 flex items-center justify-between text-xs font-medium text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Double-Entry General Ledger</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>

              <Link
                href="/admin/telegram-bots"
                className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 flex items-center justify-between text-xs font-medium text-white transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Telegram Bot Price Comparator</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
