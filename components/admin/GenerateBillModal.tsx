'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminGenerateCustomBillAction } from '@/features/invoices/generateBillAction'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { formatCurrency } from '@/lib/utils'
import {
  FileText,
  X,
  Printer,
  DollarSign,
  User,
  Sparkles,
  ExternalLink,
  Receipt,
  Percent,
} from 'lucide-react'

export function GenerateBillModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const router = useRouter()
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [productName, setProductName] = useState('ChatGPT Plus (1 Month Private)')
  const [subtotal, setSubtotal] = useState('2850')
  const [discount, setDiscount] = useState('0')
  const [applyVat, setApplyVat] = useState(false)
  const [isPaid, setIsPaid] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const numSubtotal = Number(subtotal) || 0
  const numDiscount = Number(discount) || 0
  const taxableAmount = Math.max(0, numSubtotal - numDiscount)
  const vatAmount = applyVat ? Math.round(taxableAmount * 0.13) : 0
  const totalAmount = taxableAmount + vatAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName.trim()) {
      setErrorMessage('Customer Full Name is strictly required.')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('customerName', customerName.trim())
    formData.append('customerEmail', customerEmail.trim())
    formData.append('customerPhone', customerPhone.trim())
    formData.append('productName', productName.trim())
    formData.append('subtotal', subtotal)
    formData.append('discount', discount)
    formData.append('applyVat', applyVat ? 'true' : 'false')
    formData.append('isPaid', isPaid ? 'true' : 'false')

    const res = await adminGenerateCustomBillAction(formData)
    setIsLoading(false)

    if (!res.success || !res.invoiceId) {
      setErrorMessage(res.message || 'Failed to generate invoice.')
      return
    }

    onSuccess()
    onClose()
    // Open printable tax invoice in new tab
    window.open(`/invoices/${res.invoiceId}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Generate Customer Bill & Tax Invoice</h3>
              <p className="text-xs text-neutral-400">Creates official invoice with Nepal PAN #610984512.</p>
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
          {/* Customer Information */}
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <User className="w-4 h-4 text-blue-400" />
              <span>Bill To (Customer Information)</span>
            </div>

            <Input
              label="Customer Full Name *"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Roshan Sharma"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address *"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@gmail.com"
                required
              />

              <Input
                label="Phone / WhatsApp *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+977 9800000000"
                required
              />
            </div>
          </div>

          {/* Line Item & Price */}
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Subscription Item & Amount</span>
            </div>

            <Input
              label="Item / AI Subscription Name *"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. ChatGPT Plus (1 Month Private)"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Subtotal (NPR) *"
                type="number"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
                required
              />

              <Input
                label="Discount (NPR)"
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            {/* 13% VAT Option Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Percent className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apply 13% VAT (Nepal Tax)</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Adds 13% VAT (+{formatCurrency(vatAmount)}) to final total
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyVat}
                  onChange={(e) => setApplyVat(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="pt-2 space-y-1.5 border-t border-neutral-800">
              <div className="flex justify-between text-neutral-400 text-[11px]">
                <span>Taxable Amount:</span>
                <span className="font-mono text-neutral-200">{formatCurrency(taxableAmount)}</span>
              </div>

              {applyVat && (
                <div className="flex justify-between text-amber-400 text-[11px]">
                  <span>13% VAT Amount:</span>
                  <span className="font-mono font-bold">+{formatCurrency(vatAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                <span className="text-xs font-bold text-white">Final Bill Total:</span>
                <strong className="text-base font-black text-emerald-400 font-mono">
                  {formatCurrency(totalAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Payment Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800">
            <span className="text-xs font-medium text-neutral-300">Mark as Paid (Auto-sync with General Ledger)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
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
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Generate & Print Bill</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
