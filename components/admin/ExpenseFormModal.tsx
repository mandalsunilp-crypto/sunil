'use client'

import React, { useState } from 'react'
import { adminCreateExpenseAction } from '@/features/expenses/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ExpenseCategory } from '@/types/database.types'
import {
  X,
  Receipt,
  UploadCloud,
  DollarSign,
  Calendar,
  CheckCircle2,
} from 'lucide-react'

export function ExpenseFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [category, setCategory] = useState<ExpenseCategory>('operations')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('category', category)
    formData.append('amount', amount)
    formData.append('description', description.trim())
    formData.append('expense_date', expenseDate)
    if (reference.trim()) formData.append('reference', reference.trim())
    if (selectedFile) formData.append('receiptFile', selectedFile)

    const result = await adminCreateExpenseAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to record expense.')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record Operating Expense</h3>
              <p className="text-xs text-neutral-400">
                Log business expenses, upload receipts, and automatically synchronize the financial ledger.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="advertising">Advertising / Marketing</option>
                <option value="software">Software Tools & Subscriptions</option>
                <option value="operations">General Operations & Office</option>
                <option value="payment_fees">Payment Gateway & Transfer Fees</option>
                <option value="warranty_costs">Warranty Replacements & Claims</option>
                <option value="refund_costs">Customer Refunds</option>
                <option value="other">Other Miscellaneous</option>
              </select>
            </div>

            <Input
              label="Amount in NPR *"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>

          <Input
            label="Expense Description *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Facebook Ads campaign for ChatGPT Pro launch"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Expense Date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />

            <Input
              label="Reference / Bill / Invoice #"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-9812"
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Receipt / Invoice File (Optional)</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-neutral-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-neutral-900 file:text-white hover:file:bg-neutral-800 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="bg-purple-600 hover:bg-purple-500 font-semibold"
            >
              Save Expense
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
