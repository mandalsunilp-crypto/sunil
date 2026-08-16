'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRPaymentMethod } from '@/repositories/qrPaymentRepository'
import { OrderWithDetails } from '@/repositories/orderRepository'
import { submitPaymentProofAction } from '@/features/payments/actions'
import { PaymentMethodsList } from '@/components/payments/PaymentMethodsList'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  QrCode,
  X,
} from 'lucide-react'

export function PaymentSubmissionForm({
  order,
  methods,
}: {
  order: OrderWithDetails
  methods: QRPaymentMethod[]
}) {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<QRPaymentMethod | null>(methods[0] || null)
  const [paymentReference, setPaymentReference] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fallbackUrl, setFallbackUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!selectedFile && !fallbackUrl.trim()) {
      setIsLoading(false)
      setErrorMessage('Please select or upload a payment screenshot receipt.')
      return
    }

    if (!paymentReference.trim()) {
      setIsLoading(false)
      setErrorMessage('Please provide the transaction reference ID or remarks.')
      return
    }

    const formData = new FormData()
    formData.append('orderId', order.id)
    formData.append('amount', order.total_amount.toString())
    if (selectedMethod) {
      formData.append('paymentMethodId', selectedMethod.id)
    }
    formData.append('paymentReference', paymentReference.trim())
    if (customerNotes.trim()) {
      formData.append('customerNotes', customerNotes.trim())
    }
    if (selectedFile) {
      formData.append('screenshotFile', selectedFile)
    }
    if (fallbackUrl.trim()) {
      formData.append('screenshotUrl', fallbackUrl.trim())
    }

    const result = await submitPaymentProofAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to submit payment proof.')
      return
    }

    setSuccessMessage('Payment proof submitted successfully!')
    setTimeout(() => {
      router.push(`/dashboard/orders/${order.id}`)
    }, 1500)
  }

  return (
    <div className="space-y-8">
      {/* 1. Step 1: Select Payment QR Method */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Step 1: Select Nepal Payment Method & Scan QR
          </label>
          <span className="text-xs text-neutral-400">
            Total Payable: <strong className="text-emerald-400">{formatCurrency(order.total_amount)}</strong>
          </span>
        </div>

        <PaymentMethodsList
          methods={methods}
          selectedMethodId={selectedMethod?.id}
          onSelectMethod={(m) => setSelectedMethod(m)}
        />
      </div>

      {/* 2. Step 2: Upload Proof Form */}
      <Card className="p-6 space-y-6">
        <div className="border-b border-neutral-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Step 2: Submit Proof of Payment
          </h3>
          <p className="text-xs text-neutral-400">
            Upload your transfer screenshot (eSewa / Khalti / Bank App receipt) to enable instant verification.
          </p>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Submission Error">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Transaction Reference / Remarks ID *"
              name="paymentReference"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. 1048291039 or eSewa Txn Code"
              required
              helperText="The transaction reference code from your payment app"
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-300">Verified Amount (NPR)</label>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-emerald-400 font-bold font-mono text-sm">
                {formatCurrency(order.total_amount)}
              </div>
            </div>
          </div>

          {/* Screenshot Upload Area */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-medium text-neutral-300">
              Payment Screenshot / Receipt *
            </label>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-800 hover:border-neutral-700 rounded-2xl bg-neutral-900/40 cursor-pointer transition-colors group">
                <UploadCloud className="w-8 h-8 text-neutral-500 group-hover:text-blue-400 mb-2 transition-colors" />
                <span className="text-xs font-semibold text-neutral-200">
                  Click to browse or drop payment receipt screenshot
                </span>
                <span className="text-[11px] text-neutral-500 mt-0.5">
                  PNG, JPG, JPEG or WEBP (Max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative p-3 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center gap-4">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="w-24 h-24 object-cover rounded-xl border border-neutral-800 shrink-0"
                />
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Receipt image selected</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {selectedFile?.name || 'receipt_screenshot.png'}
                  </p>
                  <span className="text-[10px] text-neutral-500">
                    {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
                  title="Remove image"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Additional Remarks (Optional)</label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Paid via eSewa account of John Doe..."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Payments are verified within 5-15 minutes</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="text-xs font-semibold px-6 shadow-lg shadow-blue-600/30"
            >
              <span>Submit Payment Verification</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
