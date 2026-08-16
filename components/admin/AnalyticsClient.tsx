'use client'

import React, { useState } from 'react'
import { FinancialAnalytics } from '@/repositories/analyticsRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Layers,
  Sparkles,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react'

export function AnalyticsClient({ analytics }: { analytics: FinancialAnalytics }) {
  const isNetProfitable = analytics.netProfit >= 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Financial Analytics & P&L</h1>
          <p className="text-xs text-neutral-400">
            Real-time profit & loss statement, gross/net margins, supplier costs, and revenue performance.
          </p>
        </div>
      </div>

      {/* Main Financial KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Net Sales Revenue</span>
          <p className="text-2xl font-black text-white">{formatCurrency(analytics.netRevenue)}</p>
          <span className="text-[10px] text-neutral-500">
            Gross: {formatCurrency(analytics.grossRevenue)} (After {formatCurrency(analytics.totalDiscounts)} discounts)
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Gross Profit (Pre-Expenses)</span>
          <p className="text-2xl font-black text-emerald-400">{formatCurrency(analytics.grossProfit)}</p>
          <span className="text-[10px] text-emerald-400/90 font-semibold">
            {analytics.grossMarginPct.toFixed(1)}% Gross Margin (COGS: {formatCurrency(analytics.totalCogs)})
          </span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Total Operating Overhead</span>
          <p className="text-2xl font-black text-red-400">-{formatCurrency(analytics.totalExpenses)}</p>
          <span className="text-[10px] text-neutral-500">
            Includes {formatCurrency(analytics.warrantyCosts)} warranty replacements
          </span>
        </Card>

        <Card className="p-4 space-y-1 border-purple-500/40 bg-purple-950/10">
          <span className="text-purple-300 font-medium">Net Profit (Bottom Line)</span>
          <p className={`text-2xl font-black ${isNetProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(analytics.netProfit)}
          </p>
          <span className={`text-[10px] font-bold ${isNetProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
            {analytics.netMarginPct.toFixed(1)}% Net Margin
          </span>
        </Card>
      </div>

      {/* Two Column Layout: Detailed P&L Statement + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: P&L Statement (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Profit & Loss Statement (P&L)</h3>
                <p className="text-xs text-neutral-400">Standardized revenue accounting statement.</p>
              </div>
              <Badge variant="primary" size="sm">NPR</Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-800/60">
                <span className="text-neutral-300 font-medium">1. Gross Subscription Sales</span>
                <span className="font-bold text-white">{formatCurrency(analytics.grossRevenue)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-800/60 text-emerald-400">
                <span>Less: Coupon Discounts & Deductions</span>
                <span>-{formatCurrency(analytics.totalDiscounts)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-neutral-800 font-bold text-white bg-neutral-900/40 px-2 rounded-lg">
                <span>Net Sales Revenue</span>
                <span>{formatCurrency(analytics.netRevenue)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-800/60 text-red-400">
                <span>Less: Cost of Goods Sold (Supplier Investment Costs)</span>
                <span>-{formatCurrency(analytics.totalCogs)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-neutral-800 font-bold text-emerald-400 bg-neutral-900/40 px-2 rounded-lg">
                <span>Gross Profit ({analytics.grossMarginPct.toFixed(1)}% Margin)</span>
                <span>{formatCurrency(analytics.grossProfit)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-800/60 text-red-400">
                <span>Less: Operating Expenses (Marketing, Software, Tools)</span>
                <span>-{formatCurrency(analytics.totalExpenses)}</span>
              </div>

              <div className="flex justify-between py-3 border-t-2 border-neutral-800 text-sm font-black text-white bg-purple-950/20 border border-purple-800/30 p-3 rounded-xl">
                <span>Net Profit After Overheads</span>
                <span className={isNetProfitable ? 'text-emerald-400' : 'text-red-400'}>
                  {formatCurrency(analytics.netProfit)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Best-Selling Products Leaderboard (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="p-6 space-y-5">
            <div className="border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Top-Performing AI Subscriptions</h3>
              <p className="text-xs text-neutral-400">Ranking by total customer volume and revenue.</p>
            </div>

            {analytics.topProducts.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No sales recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {analytics.topProducts.map((p, idx) => (
                  <div
                    key={p.productId}
                    className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs font-mono">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{p.productName}</h4>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono">{p.category}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">{formatCurrency(p.totalRevenue)}</p>
                      <span className="text-[10px] text-neutral-400">{p.totalSold} Units Sold</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Platform Metrics */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800 text-xs">
              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-0.5">
                <span className="text-neutral-400 text-[11px]">Total Platform Customers</span>
                <p className="text-lg font-bold text-white">{analytics.totalCustomers}</p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-0.5">
                <span className="text-neutral-400 text-[11px]">Active Subscriptions</span>
                <p className="text-lg font-bold text-blue-400">{analytics.activeSubscriptionsCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
