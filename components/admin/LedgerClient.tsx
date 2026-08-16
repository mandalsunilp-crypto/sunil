'use client'

import React, { useState } from 'react'
import { LedgerEntry, LedgerSummary } from '@/repositories/ledgerRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Layers,
} from 'lucide-react'

export function LedgerClient({
  initialEntries,
  summary,
}: {
  initialEntries: LedgerEntry[]
  summary: LedgerSummary
}) {
  const [entries] = useState(initialEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const filteredEntries = entries.filter((e) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch = e.description.toLowerCase().includes(s) || e.account.toLowerCase().includes(s)
    const matchesAccount = accountFilter === 'ALL' || e.account === accountFilter
    const matchesType = typeFilter === 'ALL' || e.type === typeFilter

    return matchesSearch && matchesAccount && matchesType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">General Financial Ledger</h1>
          <p className="text-xs text-neutral-400">
            Double-entry accounting journal recording every subscription sale, expense, and inventory asset.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {summary.isBalanced ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ledger Balanced (DR = CR)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>Unbalanced Ledger Alert</span>
            </div>
          )}
        </div>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Total Debits</span>
          <p className="text-xl font-bold text-white">{formatCurrency(summary.totalDebits)}</p>
          <span className="text-[10px] text-neutral-500">Asset & Expense debits</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Total Credits</span>
          <p className="text-xl font-bold text-white">{formatCurrency(summary.totalCredits)}</p>
          <span className="text-[10px] text-neutral-500">Revenue & Liability credits</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Cash & Bank (Net)</span>
          <p className="text-xl font-bold text-emerald-400">
            {formatCurrency(summary.accountBalances['cash_bank']?.net || 0)}
          </p>
          <span className="text-[10px] text-neutral-500">Available liquid balance</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Subscription Sales</span>
          <p className="text-xl font-bold text-blue-400">
            {formatCurrency(summary.accountBalances['subscription_sales']?.credit || 0)}
          </p>
          <span className="text-[10px] text-neutral-500">Total credited revenue</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search journal descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Chart of Accounts</option>
              <option value="cash_bank">Cash & Bank (Asset)</option>
              <option value="subscription_sales">Subscription Sales (Revenue)</option>
              <option value="inventory_asset">Inventory (Asset)</option>
              <option value="operating_expenses">Operating Expenses</option>
              <option value="warranty_expenses">Warranty Expenses</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">Debit & Credit</option>
              <option value="debit">Debits Only</option>
              <option value="credit">Credits Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Journal Table */}
      <Card className="p-0 overflow-hidden">
        {filteredEntries.length === 0 ? (
          <EmptyState
            title="No Journal Entries"
            description="No ledger records match the selected account or filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Transaction Ref</th>
                  <th className="p-3.5">Account</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Debit (DR)</th>
                  <th className="p-3.5 text-right">Credit (CR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 text-neutral-400">
                      {formatDate(e.created_at)}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-neutral-400">
                      {e.transaction_id.slice(0, 8)}...
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-mono text-[11px]">
                        {e.account.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-200 font-medium max-w-sm">
                      {e.description}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">
                      {e.type === 'debit' ? formatCurrency(e.amount) : '—'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                      {e.type === 'credit' ? formatCurrency(e.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
