'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExpenseWithProfile } from '@/repositories/expenseRepository'
import { ExpenseFormModal } from '@/components/admin/ExpenseFormModal'
import { adminDeleteExpenseAction } from '@/features/expenses/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  DollarSign,
  TrendingDown,
} from 'lucide-react'

export function ExpensesClient({ initialExpenses }: { initialExpenses: ExpenseWithProfile[] }) {
  const router = useRouter()
  const [expenses, setExpenses] = useState(initialExpenses)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const advertisingTotal = expenses
    .filter((e) => e.category === 'advertising')
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const softwareTotal = expenses
    .filter((e) => e.category === 'software')
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const operationsTotal = expenses
    .filter((e) => e.category === 'operations')
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const filteredExpenses = expenses.filter((e) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      e.description.toLowerCase().includes(s) ||
      (e.reference && e.reference.toLowerCase().includes(s))

    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this expense record?')) return
    setDeletingId(id)
    const res = await adminDeleteExpenseAction(id)
    setDeletingId(null)

    if (res.success) {
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-neutral-400">
            Record overhead costs, advertising spend, software tools, and payment fees.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Record Expense</span>
        </Button>
      </div>

      {/* Category Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Total Expenses</span>
          <p className="text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
          <span className="text-[10px] text-neutral-500">{expenses.length} Records Logged</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Advertising Spend</span>
          <p className="text-xl font-bold text-white">{formatCurrency(advertisingTotal)}</p>
          <span className="text-[10px] text-neutral-500">Marketing & Growth</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Software & Subscriptions</span>
          <p className="text-xl font-bold text-white">{formatCurrency(softwareTotal)}</p>
          <span className="text-[10px] text-neutral-500">Tools & Infrastructure</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Operations</span>
          <p className="text-xl font-bold text-white">{formatCurrency(operationsTotal)}</p>
          <span className="text-[10px] text-neutral-500">Office & General</span>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by description or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Categories ({expenses.length})</option>
              <option value="advertising">Advertising</option>
              <option value="software">Software</option>
              <option value="operations">Operations</option>
              <option value="payment_fees">Payment Fees</option>
              <option value="warranty_costs">Warranty Costs</option>
              <option value="refund_costs">Refund Costs</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="p-0 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <EmptyState
            title="No Expenses Logged"
            description="Record your operational costs to get accurate profit and loss calculations."
            action={
              <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Record Expense
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Reference</th>
                  <th className="p-3.5">Logged By</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 text-neutral-400">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white font-mono text-[11px]">
                        {exp.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-white max-w-xs">
                      {exp.description}
                    </td>
                    <td className="p-3.5 text-neutral-400 font-mono">
                      {exp.reference || '—'}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      {exp.profiles?.full_name || 'Staff'}
                    </td>
                    <td className="p-3.5 text-right font-bold text-red-400">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.receipt_url && (
                          <a
                            href={exp.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="View Receipt"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={deletingId === exp.id}
                          onClick={() => handleDelete(exp.id)}
                          className="text-neutral-500 hover:text-red-400 text-[10px] p-1 border-none hover:bg-neutral-900"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {modalOpen && (
        <ExpenseFormModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
